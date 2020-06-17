"use strict";
const fetch = require("node-fetch");
const WebSocket = require("websocket").w3cwebsocket;

const { Socket } = require("./phoenix");
const configs = require("./configs");

function hasReticulumServer() {
  return !!configs.RETICULUM_SERVER;
}

// function isLocalClient() {
//   return (
//     hasReticulumServer() && document.location.host !== configs.RETICULUM_SERVER
//   );
// }

// const resolverLink = document.createElement("a");
let reticulumMeta = null;
// let invalidatedReticulumMetaThisSession = false;

function getReticulumFetchUrl(
  path,
  absolute = false,
  host = null,
  port = null
) {
  if (host || hasReticulumServer()) {
    return `https://${host || configs.RETICULUM_SERVER}${
      port ? `:${port}` : ""
    }${path}`;
    // } else if (absolute) {
    //   resolverLink.href = path;
    //   return resolverLink.href;
  } else {
    return path;
  }
}

async function getReticulumMeta() {
  if (!reticulumMeta) {
    // Initially look up version based upon page, avoiding round-trip, otherwise fetch.
    // if (
    //   !invalidatedReticulumMetaThisSession &&
    //   document.querySelector("meta[name='ret:version']")
    // ) {
    //   reticulumMeta = {
    //     version: document
    //       .querySelector("meta[name='ret:version']")
    //       .getAttribute("value"),
    //     pool: document
    //       .querySelector("meta[name='ret:pool']")
    //       .getAttribute("value"),
    //     phx_host: document
    //       .querySelector("meta[name='ret:phx_host']")
    //       .getAttribute("value"),
    //   };
    // } else {
    await fetch(getReticulumFetchUrl("/api/v1/meta")).then(async (res) => {
      //TODO if meta unreachable, cannot parse json
      reticulumMeta = await res.json();
    });
    // }
  }
  // const qs = new URLSearchParams(location.search);
  // const phxHostOverride = qs.get("phx_host");

  // if (phxHostOverride) {
  //   reticulumMeta.phx_host = phxHostOverride;
  // }

  return reticulumMeta;
}

let directReticulumHostAndPort;

async function refreshDirectReticulumHostAndPort() {
  const host =
    configs.RETICULUM_SOCKET_SERVER || (await getReticulumMeta()).phx_host;
  const port = hasReticulumServer()
    ? new URL(`https://${configs.RETICULUM_SERVER}`).port
    : "443";
  directReticulumHostAndPort = { host, port };
}

function getDirectReticulumFetchUrl(path, absolute = false) {
  if (!directReticulumHostAndPort) {
    console.warn(
      "Cannot call getDirectReticulumFetchUrl before connectToReticulum. Returning non-direct url."
    );
    return getReticulumFetchUrl(path, absolute);
  }

  const { host, port } = directReticulumHostAndPort;
  return getReticulumFetchUrl(path, absolute, host, port);
}

async function invalidateReticulumMeta() {
  // invalidatedReticulumMetaThisSession = true;
  reticulumMeta = null;
}

async function connectToReticulum(
  debug = false,
  params = null,
  socketClass = Socket,
  hostOverride = {}
) {
  if (debug === undefined || debug === null) debug = false;
  if (socketClass === undefined || socketClass === null) socketClass = Socket;
  const getNewSocketUrl = async () => {
    const {
      host: hostForce,
      port: portForce,
      protocol: protocolForce,
    } = hostOverride;
    if (hostForce)
      return `${
        protocolForce || configs.RETICULUM_SOCKET_PROTOCOL || "wss:"
      }//${hostForce}${portForce || ""}`;
    await refreshDirectReticulumHostAndPort();
    const { host, port } = directReticulumHostAndPort;
    const protocol = configs.RETICULUM_SOCKET_PROTOCOL || "wss:";
    return `${protocol}//${host}${port ? `:${port}` : ""}`;
  };

  const socketUrl = await getNewSocketUrl();

  const socketSettings = { transport: WebSocket };

  if (debug) {
    socketSettings.logger = (kind, msg, data) => {
      console.log(`${kind}: ${msg}`, data || "");
    };
  }

  if (params) {
    socketSettings.params = params;
  }

  const socket = new socketClass(`${socketUrl}/socket`, socketSettings);
  socket.connect();
  socket.onError(async () => {
    // On error, underlying reticulum node may have died, so rebalance by
    // fetching a new healthy node to connect to.
    invalidateReticulumMeta();

    const endPointPath = new URL(socket.endPoint).pathname;
    const newSocketUrl = await getNewSocketUrl();
    const newEndPoint = `${newSocketUrl}${endPointPath}`;
    console.log(`Socket error, changed endpoint to ${newEndPoint}`);
    socket.endPoint = newEndPoint;
  });

  return socket;
}

function getLandingPageForPhoto(photoUrl) {
  const parsedUrl = new URL(photoUrl);
  return getReticulumFetchUrl(
    parsedUrl.pathname.replace(".png", ".html") + parsedUrl.search,
    true
  );
}

function fetchReticulumAuthenticated(url, method = "GET", payload) {
  const { token } = window.APP.store.state.credentials;
  const retUrl = getReticulumFetchUrl(url);
  const params = {
    headers: { "content-type": "application/json" },
    method,
  };
  if (token) {
    params.headers.authorization = `bearer ${token}`;
  }
  if (payload) {
    params.body = JSON.stringify(payload);
  }
  return fetch(retUrl, params).then(async (r) => {
    const result = await r.text();
    try {
      return JSON.parse(result);
    } catch (e) {
      // Some reticulum responses, particularly DELETE requests, don't return json.
      return result;
    }
  });
}

// Takes the given channel, and creates a new channel with the same bindings
// with the given socket, joins it, and leaves the old channel after joining.
//
// NOTE: This function relies upon phoenix channel object internals, so this
// function will need to be reviewed if/when we ever update phoenix.js
function migrateChannelToSocket(oldChannel, socket, params) {
  const channel = socket.channel(oldChannel.topic, params || oldChannel.params);

  for (let i = 0, l = oldChannel.bindings.length; i < l; i++) {
    const item = oldChannel.bindings[i];
    channel.on(item.event, item.callback);
  }

  for (let i = 0, l = oldChannel.pushBuffer.length; i < l; i++) {
    const item = oldChannel.pushBuffer[i];
    channel.push(item.event, item.payload, item.timeout);
  }

  const oldJoinPush = oldChannel.joinPush;
  const joinPush = channel.join();

  for (let i = 0, l = oldJoinPush.recHooks.length; i < l; i++) {
    const item = oldJoinPush.recHooks[i];
    joinPush.receive(item.status, item.callback);
  }

  return new Promise((resolve) => {
    joinPush.receive("ok", () => {
      // Clear all event handlers first so no duplicate messages come in.
      oldChannel.bindings = [];
      resolve(channel);
    });
  });
}

module.exports = {
  hasReticulumServer,
  getReticulumFetchUrl,
  getReticulumMeta,
  getDirectReticulumFetchUrl,
  invalidateReticulumMeta,
  connectToReticulum,
  getLandingPageForPhoto,
  fetchReticulumAuthenticated,
  migrateChannelToSocket,
};
