!(function (e, t) {
  "object" == typeof exports && "object" == typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
    ? define([], t)
    : "object" == typeof exports
    ? (exports.Phoenix = t())
    : (e.Phoenix = t());
})(this, function () {
  return (function (e) {
    var t = {};
    function s(i) {
      if (t[i]) return t[i].exports;
      var n = (t[i] = { i: i, l: !1, exports: {} });
      return e[i].call(n.exports, n, n.exports, s), (n.l = !0), n.exports;
    }
    return (
      (s.m = e),
      (s.c = t),
      (s.d = function (e, t, i) {
        s.o(e, t) || Object.defineProperty(e, t, { enumerable: !0, get: i });
      }),
      (s.r = function (e) {
        "undefined" != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
          Object.defineProperty(e, "__esModule", { value: !0 });
      }),
      (s.t = function (e, t) {
        if ((1 & t && (e = s(e)), 8 & t)) return e;
        if (4 & t && "object" == typeof e && e && e.__esModule) return e;
        var i = Object.create(null);
        if (
          (s.r(i),
          Object.defineProperty(i, "default", { enumerable: !0, value: e }),
          2 & t && "string" != typeof e)
        )
          for (var n in e)
            s.d(
              i,
              n,
              function (t) {
                return e[t];
              }.bind(null, n)
            );
        return i;
      }),
      (s.n = function (e) {
        var t =
          e && e.__esModule
            ? function () {
                return e.default;
              }
            : function () {
                return e;
              };
        return s.d(t, "a", t), t;
      }),
      (s.o = function (e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
      }),
      (s.p = ""),
      s((s.s = 0))
    );
  })([
    function (e, t, s) {
      (function (t) {
        e.exports = t.Phoenix = s(2);
      }.call(this, s(1)));
    },
    function (e, t) {
      var s;
      s = (function () {
        return this;
      })();
      try {
        s = s || new Function("return this")();
      } catch (e) {
        "object" == typeof window && (s = window);
      }
      e.exports = s;
    },
    function (e, t, s) {
      "use strict";
      s.r(t),
        s.d(t, "Channel", function () {
          return E;
        }),
        s.d(t, "Serializer", function () {
          return w;
        }),
        s.d(t, "Socket", function () {
          return S;
        }),
        s.d(t, "LongPoll", function () {
          return x;
        }),
        s.d(t, "Ajax", function () {
          return P;
        }),
        s.d(t, "Presence", function () {
          return O;
        });
      const i = "undefined" != typeof self ? self : null,
        n = "undefined" != typeof window ? window : null,
        o = i || n || void 0,
        r = 0,
        h = 1,
        a = 2,
        c = 3,
        l = "closed",
        u = "errored",
        f = "joined",
        d = "joining",
        p = "leaving",
        m = "phx_close",
        g = "phx_error",
        b = "phx_join",
        v = "phx_reply",
        j = "phx_leave",
        y = [m, g, b, v, j],
        k = "longpoll",
        R = "websocket";
      let C = (e) => {
        if ("function" == typeof e) return e;
        return function () {
          return e;
        };
      };
      class T {
        constructor(e, t, s, i) {
          (this.channel = e),
            (this.event = t),
            (this.payload =
              s ||
              function () {
                return {};
              }),
            (this.receivedResp = null),
            (this.timeout = i),
            (this.timeoutTimer = null),
            (this.recHooks = []),
            (this.sent = !1);
        }
        resend(e) {
          (this.timeout = e), this.reset(), this.send();
        }
        send() {
          this.hasReceived("timeout") ||
            (this.startTimeout(),
            (this.sent = !0),
            this.channel.socket.push({
              topic: this.channel.topic,
              event: this.event,
              payload: this.payload(),
              ref: this.ref,
              join_ref: this.channel.joinRef(),
            }));
        }
        receive(e, t) {
          return (
            this.hasReceived(e) && t(this.receivedResp.response),
            this.recHooks.push({ status: e, callback: t }),
            this
          );
        }
        reset() {
          this.cancelRefEvent(),
            (this.ref = null),
            (this.refEvent = null),
            (this.receivedResp = null),
            (this.sent = !1);
        }
        matchReceive({ status: e, response: t, ref: s }) {
          this.recHooks
            .filter((t) => t.status === e)
            .forEach((e) => e.callback(t));
        }
        cancelRefEvent() {
          this.refEvent && this.channel.off(this.refEvent);
        }
        cancelTimeout() {
          clearTimeout(this.timeoutTimer), (this.timeoutTimer = null);
        }
        startTimeout() {
          this.timeoutTimer && this.cancelTimeout(),
            (this.ref = this.channel.socket.makeRef()),
            (this.refEvent = this.channel.replyEventName(this.ref)),
            this.channel.on(this.refEvent, (e) => {
              this.cancelRefEvent(),
                this.cancelTimeout(),
                (this.receivedResp = e),
                this.matchReceive(e);
            }),
            (this.timeoutTimer = setTimeout(() => {
              this.trigger("timeout", {});
            }, this.timeout));
        }
        hasReceived(e) {
          return this.receivedResp && this.receivedResp.status === e;
        }
        trigger(e, t) {
          this.channel.trigger(this.refEvent, { status: e, response: t });
        }
      }
      class E {
        constructor(e, t, s) {
          (this.state = l),
            (this.topic = e),
            (this.params = C(t || {})),
            (this.socket = s),
            (this.bindings = []),
            (this.bindingRef = 0),
            (this.timeout = this.socket.timeout),
            (this.joinedOnce = !1),
            (this.joinPush = new T(this, b, this.params, this.timeout)),
            (this.pushBuffer = []),
            (this.rejoinTimer = new L(() => {
              this.socket.isConnected() && this.rejoin();
            }, this.socket.rejoinAfterMs)),
            this.socket.onError(() => this.rejoinTimer.reset()),
            this.socket.onOpen(() => {
              this.rejoinTimer.reset(), this.isErrored() && this.rejoin();
            }),
            this.joinPush.receive("ok", () => {
              (this.state = f),
                this.rejoinTimer.reset(),
                this.pushBuffer.forEach((e) => e.send()),
                (this.pushBuffer = []);
            }),
            this.joinPush.receive("error", () => {
              (this.state = u),
                this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
            }),
            this.onClose(() => {
              this.rejoinTimer.reset(),
                this.socket.hasLogger() &&
                  this.socket.log(
                    "channel",
                    `close ${this.topic} ${this.joinRef()}`
                  ),
                (this.state = l),
                this.socket.remove(this);
            }),
            this.onError((e) => {
              this.socket.hasLogger() &&
                this.socket.log("channel", "error " + this.topic, e),
                this.isJoining() && this.joinPush.reset(),
                (this.state = u),
                this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
            }),
            this.joinPush.receive("timeout", () => {
              this.socket.hasLogger() &&
                this.socket.log(
                  "channel",
                  `timeout ${this.topic} (${this.joinRef()})`,
                  this.joinPush.timeout
                ),
                new T(this, j, C({}), this.timeout).send(),
                (this.state = u),
                this.joinPush.reset(),
                this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
            }),
            this.on(v, (e, t) => {
              this.trigger(this.replyEventName(t), e);
            });
        }
        join(e = this.timeout) {
          if (this.joinedOnce)
            throw new Error(
              "tried to join multiple times. 'join' can only be called a single time per channel instance"
            );
          return (
            (this.timeout = e),
            (this.joinedOnce = !0),
            this.rejoin(),
            this.joinPush
          );
        }
        onClose(e) {
          this.on(m, e);
        }
        onError(e) {
          return this.on(g, (t) => e(t));
        }
        on(e, t) {
          let s = this.bindingRef++;
          return this.bindings.push({ event: e, ref: s, callback: t }), s;
        }
        off(e, t) {
          this.bindings = this.bindings.filter(
            (s) => !(s.event === e && (void 0 === t || t === s.ref))
          );
        }
        canPush() {
          return this.socket.isConnected() && this.isJoined();
        }
        push(e, t, s = this.timeout) {
          if (!this.joinedOnce)
            throw new Error(
              `tried to push '${e}' to '${this.topic}' before joining. Use channel.join() before pushing events`
            );
          let i = new T(
            this,
            e,
            function () {
              return t;
            },
            s
          );
          return (
            this.canPush()
              ? i.send()
              : (i.startTimeout(), this.pushBuffer.push(i)),
            i
          );
        }
        pushUnreliable(e, t) {
          if (!this.joinedOnce)
            throw `tried to push '${e}' to '${this.topic}' before joining. Use channel.join() before pushing events`;
          this.socket.push(
            {
              topic: this.topic,
              event: e,
              payload: t,
              ref: null,
              join_ref: this.joinRef(),
            },
            !1
          );
        }
        leave(e = this.timeout) {
          this.rejoinTimer.reset(),
            this.joinPush.cancelTimeout(),
            (this.state = p);
          let t = () => {
              this.socket.hasLogger() &&
                this.socket.log("channel", "leave " + this.topic),
                this.trigger(m, "leave");
            },
            s = new T(this, j, C({}), e);
          return (
            s.receive("ok", () => t()).receive("timeout", () => t()),
            s.send(),
            this.canPush() || s.trigger("ok", {}),
            s
          );
        }
        onMessage(e, t, s) {
          return t;
        }
        isLifecycleEvent(e) {
          return y.indexOf(e) >= 0;
        }
        isMember(e, t, s, i) {
          return (
            this.topic === e &&
            (!i ||
              i === this.joinRef() ||
              !this.isLifecycleEvent(t) ||
              (this.socket.hasLogger() &&
                this.socket.log("channel", "dropping outdated message", {
                  topic: e,
                  event: t,
                  payload: s,
                  joinRef: i,
                }),
              !1))
          );
        }
        joinRef() {
          return this.joinPush.ref;
        }
        sendJoin(e) {
          (this.state = d), this.joinPush.resend(e);
        }
        rejoin(e = this.timeout) {
          this.isLeaving() || this.sendJoin(e);
        }
        trigger(e, t, s, i) {
          let n = this.onMessage(e, t, s, i);
          if (t && !n)
            throw new Error(
              "channel onMessage callbacks must return the payload, modified or unmodified"
            );
          for (let t = 0; t < this.bindings.length; t++) {
            const o = this.bindings[t];
            o.event === e && o.callback(n, s, i || this.joinRef());
          }
        }
        replyEventName(e) {
          return "chan_reply_" + e;
        }
        isClosed() {
          return this.state === l;
        }
        isErrored() {
          return this.state === u;
        }
        isJoined() {
          return this.state === f;
        }
        isJoining() {
          return this.state === d;
        }
        isLeaving() {
          return this.state === p;
        }
      }
      let w = {
        encode(e, t) {
          let s = [e.join_ref, e.ref, e.topic, e.event, e.payload];
          return t(JSON.stringify(s));
        },
        decode(e, t) {
          let [s, i, n, o, r] = JSON.parse(e);
          return t({ join_ref: s, ref: i, topic: n, event: o, payload: r });
        },
      };
      class S {
        constructor(e, t = {}) {
          (this.stateChangeCallbacks = {
            open: [],
            close: [],
            error: [],
            message: [],
          }),
            (this.channels = []),
            (this.sendBuffer = []),
            (this.ref = 0),
            (this.timeout = t.timeout || 1e4),
            (this.transport = t.transport || o.WebSocket || x),
            (this.defaultEncoder = w.encode),
            (this.defaultDecoder = w.decode),
            (this.closeWasClean = !1),
            (this.unloaded = !1),
            (this.binaryType = t.binaryType || "arraybuffer"),
            this.transport !== x
              ? ((this.encode = t.encode || this.defaultEncoder),
                (this.decode = t.decode || this.defaultDecoder))
              : ((this.encode = this.defaultEncoder),
                (this.decode = this.defaultDecoder)),
            n &&
              n.addEventListener &&
              n.addEventListener("beforeunload", (e) => {
                this.conn &&
                  ((this.unloaded = !0), this.abnormalClose("unloaded"));
              }),
            (this.heartbeatIntervalMs = t.heartbeatIntervalMs || 3e4),
            (this.rejoinAfterMs = (e) =>
              t.rejoinAfterMs
                ? t.rejoinAfterMs(e)
                : [1e3, 2e3, 5e3][e - 1] || 1e4),
            (this.reconnectAfterMs = (e) =>
              this.unloaded
                ? 100
                : t.reconnectAfterMs
                ? t.reconnectAfterMs(e)
                : [10, 50, 100, 150, 200, 250, 500, 1e3, 2e3][e - 1] || 5e3),
            (this.logger = t.logger || null),
            (this.longpollerTimeout = t.longpollerTimeout || 2e4),
            (this.params = C(t.params || {})),
            (this.endPoint = `${e}/${R}`),
            (this.heartbeatTimer = null),
            (this.pendingHeartbeatRef = null),
            (this.reconnectTimer = new L(() => {
              this.teardown(() => this.connect());
            }, this.reconnectAfterMs));
        }
        protocol() {
          return location.protocol.match(/^https/) ? "wss" : "ws";
        }
        endPointURL() {
          let e = P.appendParams(P.appendParams(this.endPoint, this.params()), {
            vsn: "2.0.0",
          });
          return "/" !== e.charAt(0)
            ? e
            : "/" === e.charAt(1)
            ? `${this.protocol()}:${e}`
            : `${this.protocol()}://${location.host}${e}`;
        }
        disconnect(e, t, s) {
          (this.closeWasClean = !0),
            this.reconnectTimer.reset(),
            this.teardown(e, t, s);
        }
        connect(e) {
          e &&
            (console &&
              console.log(
                "passing params to connect is deprecated. Instead pass :params to the Socket constructor"
              ),
            (this.params = C(e))),
            this.conn ||
              ((this.closeWasClean = !1),
              (this.conn = new this.transport(this.endPointURL())),
              (this.conn.binaryType = this.binaryType),
              (this.conn.timeout = this.longpollerTimeout),
              (this.conn.onopen = () => this.onConnOpen()),
              (this.conn.onerror = (e) => this.onConnError(e)),
              (this.conn.onmessage = (e) => this.onConnMessage(e)),
              (this.conn.onclose = (e) => this.onConnClose(e)));
        }
        log(e, t, s) {
          this.logger(e, t, s);
        }
        hasLogger() {
          return null !== this.logger;
        }
        onOpen(e) {
          this.stateChangeCallbacks.open.push(e);
        }
        onClose(e) {
          this.stateChangeCallbacks.close.push(e);
        }
        onError(e) {
          this.stateChangeCallbacks.error.push(e);
        }
        onMessage(e) {
          this.stateChangeCallbacks.message.push(e);
        }
        onConnOpen() {
          this.hasLogger() &&
            this.log("transport", "connected to " + this.endPointURL()),
            (this.unloaded = !1),
            (this.closeWasClean = !1),
            this.flushSendBuffer(),
            this.reconnectTimer.reset(),
            this.resetHeartbeat(),
            this.stateChangeCallbacks.open.forEach((e) => e());
        }
        resetHeartbeat() {
          (this.conn && this.conn.skipHeartbeat) ||
            ((this.pendingHeartbeatRef = null),
            clearInterval(this.heartbeatTimer),
            (this.heartbeatTimer = setInterval(
              () => this.sendHeartbeat(),
              this.heartbeatIntervalMs
            )));
        }
        teardown(e, t, s) {
          this.conn &&
            ((this.conn.onclose = function () {}),
            t ? this.conn.close(t, s || "") : this.conn.close(),
            (this.conn = null)),
            e && e();
        }
        onConnClose(e) {
          this.hasLogger() && this.log("transport", "close", e),
            this.triggerChanError(),
            clearInterval(this.heartbeatTimer),
            this.closeWasClean || this.reconnectTimer.scheduleTimeout(),
            this.stateChangeCallbacks.close.forEach((t) => t(e));
        }
        onConnError(e) {
          this.hasLogger() && this.log("transport", e),
            this.triggerChanError(),
            this.stateChangeCallbacks.error.forEach((t) => t(e));
        }
        triggerChanError() {
          this.channels.forEach((e) => {
            e.isErrored() || e.isLeaving() || e.isClosed() || e.trigger(g);
          });
        }
        connectionState() {
          switch (this.conn && this.conn.readyState) {
            case r:
              return "connecting";
            case h:
              return "open";
            case a:
              return "closing";
            default:
              return "closed";
          }
        }
        isConnected() {
          return "open" === this.connectionState();
        }
        remove(e) {
          this.channels = this.channels.filter(
            (t) => t.joinRef() !== e.joinRef()
          );
        }
        channel(e, t = {}) {
          let s = new E(e, t, this);
          return this.channels.push(s), s;
        }
        push(e, t = !0) {
          if (this.hasLogger()) {
            let { topic: t, event: s, payload: i, ref: n, join_ref: o } = e;
            this.log("push", `${t} ${s} (${o}, ${n})`, i);
          }
          this.isConnected()
            ? this.encode(e, (e) => this.conn.send(e))
            : t &&
              this.sendBuffer.push(() =>
                this.encode(e, (e) => this.conn.send(e))
              );
        }
        makeRef() {
          let e = this.ref + 1;
          return (
            e === this.ref ? (this.ref = 0) : (this.ref = e),
            this.ref.toString()
          );
        }
        sendHeartbeat() {
          if (this.isConnected()) {
            if (this.pendingHeartbeatRef)
              return (
                (this.pendingHeartbeatRef = null),
                this.hasLogger() &&
                  this.log(
                    "transport",
                    "heartbeat timeout. Attempting to re-establish connection"
                  ),
                void this.abnormalClose("heartbeat timeout")
              );
            (this.pendingHeartbeatRef = this.makeRef()),
              this.push({
                topic: "phoenix",
                event: "heartbeat",
                payload: {},
                ref: this.pendingHeartbeatRef,
              });
          }
        }
        abnormalClose(e) {
          (this.closeWasClean = !1), this.conn.close(1e3, e);
        }
        flushSendBuffer() {
          this.isConnected() &&
            this.sendBuffer.length > 0 &&
            (this.sendBuffer.forEach((e) => e()), (this.sendBuffer = []));
        }
        onConnMessage(e) {
          this.decode(e.data, (e) => {
            let { topic: t, event: s, payload: i, ref: n, join_ref: o } = e;
            n &&
              n === this.pendingHeartbeatRef &&
              (this.pendingHeartbeatRef = null),
              this.hasLogger() &&
                this.log(
                  "receive",
                  `${i.status || ""} ${t} ${s} ${(n && "(" + n + ")") || ""}`,
                  i
                );
            for (let e = 0; e < this.channels.length; e++) {
              const r = this.channels[e];
              r.isMember(t, s, i, o) && r.trigger(s, i, n, o);
            }
            for (let t = 0; t < this.stateChangeCallbacks.message.length; t++)
              this.stateChangeCallbacks.message[t](e);
          });
        }
      }
      class x {
        constructor(e) {
          (this.endPoint = null),
            (this.token = null),
            (this.skipHeartbeat = !0),
            (this.onopen = function () {}),
            (this.onerror = function () {}),
            (this.onmessage = function () {}),
            (this.onclose = function () {}),
            (this.pollEndpoint = this.normalizeEndpoint(e)),
            (this.readyState = r),
            this.poll();
        }
        normalizeEndpoint(e) {
          return e
            .replace("ws://", "http://")
            .replace("wss://", "https://")
            .replace(new RegExp("(.*)/" + R), "$1/" + k);
        }
        endpointURL() {
          return P.appendParams(this.pollEndpoint, { token: this.token });
        }
        closeAndRetry() {
          this.close(), (this.readyState = r);
        }
        ontimeout() {
          this.onerror("timeout"), this.closeAndRetry();
        }
        poll() {
          (this.readyState !== h && this.readyState !== r) ||
            P.request(
              "GET",
              this.endpointURL(),
              "application/json",
              null,
              this.timeout,
              this.ontimeout.bind(this),
              (e) => {
                if (e) {
                  var { status: t, token: s, messages: i } = e;
                  this.token = s;
                } else var t = 0;
                switch (t) {
                  case 200:
                    i.forEach((e) => this.onmessage({ data: e })), this.poll();
                    break;
                  case 204:
                    this.poll();
                    break;
                  case 410:
                    (this.readyState = h), this.onopen(), this.poll();
                    break;
                  case 0:
                  case 500:
                    this.onerror(), this.closeAndRetry();
                    break;
                  default:
                    throw new Error("unhandled poll status " + t);
                }
              }
            );
        }
        send(e) {
          P.request(
            "POST",
            this.endpointURL(),
            "application/json",
            e,
            this.timeout,
            this.onerror.bind(this, "timeout"),
            (e) => {
              (e && 200 === e.status) ||
                (this.onerror(e && e.status), this.closeAndRetry());
            }
          );
        }
        close(e, t) {
          (this.readyState = c), this.onclose();
        }
      }
      class P {
        static request(e, t, s, i, n, r, h) {
          if (o.XDomainRequest) {
            let s = new XDomainRequest();
            this.xdomainRequest(s, e, t, i, n, r, h);
          } else {
            let a = o.XMLHttpRequest
              ? new o.XMLHttpRequest()
              : new ActiveXObject("Microsoft.XMLHTTP");
            this.xhrRequest(a, e, t, s, i, n, r, h);
          }
        }
        static xdomainRequest(e, t, s, i, n, o, r) {
          (e.timeout = n),
            e.open(t, s),
            (e.onload = () => {
              let t = this.parseJSON(e.responseText);
              r && r(t);
            }),
            o && (e.ontimeout = o),
            (e.onprogress = () => {}),
            e.send(i);
        }
        static xhrRequest(e, t, s, i, n, o, r, h) {
          e.open(t, s, !0),
            (e.timeout = o),
            e.setRequestHeader("Content-Type", i),
            (e.onerror = () => {
              h && h(null);
            }),
            (e.onreadystatechange = () => {
              if (e.readyState === this.states.complete && h) {
                let t = this.parseJSON(e.responseText);
                h(t);
              }
            }),
            r && (e.ontimeout = r),
            e.send(n);
        }
        static parseJSON(e) {
          if (!e || "" === e) return null;
          try {
            return JSON.parse(e);
          } catch (t) {
            return (
              console && console.log("failed to parse JSON response", e), null
            );
          }
        }
        static serialize(e, t) {
          let s = [];
          for (var i in e) {
            if (!e.hasOwnProperty(i)) continue;
            let n = t ? `${t}[${i}]` : i,
              o = e[i];
            "object" == typeof o
              ? s.push(this.serialize(o, n))
              : s.push(encodeURIComponent(n) + "=" + encodeURIComponent(o));
          }
          return s.join("&");
        }
        static appendParams(e, t) {
          if (0 === Object.keys(t).length) return e;
          let s = e.match(/\?/) ? "&" : "?";
          return `${e}${s}${this.serialize(t)}`;
        }
      }
      P.states = { complete: 4 };
      class O {
        constructor(e, t = {}) {
          let s = t.events || {
            state: "presence_state",
            diff: "presence_diff",
          };
          (this.state = {}),
            (this.pendingDiffs = []),
            (this.channel = e),
            (this.joinRef = null),
            (this.caller = {
              onJoin: function () {},
              onLeave: function () {},
              onSync: function () {},
            }),
            this.channel.on(s.state, (e) => {
              let { onJoin: t, onLeave: s, onSync: i } = this.caller;
              (this.joinRef = this.channel.joinRef()),
                (this.state = O.syncState(this.state, e, t, s)),
                this.pendingDiffs.forEach((e) => {
                  this.state = O.syncDiff(this.state, e, t, s);
                }),
                (this.pendingDiffs = []),
                i();
            }),
            this.channel.on(s.diff, (e) => {
              let { onJoin: t, onLeave: s, onSync: i } = this.caller;
              this.inPendingSyncState()
                ? this.pendingDiffs.push(e)
                : ((this.state = O.syncDiff(this.state, e, t, s)), i());
            });
        }
        onJoin(e) {
          this.caller.onJoin = e;
        }
        onLeave(e) {
          this.caller.onLeave = e;
        }
        onSync(e) {
          this.caller.onSync = e;
        }
        list(e) {
          return O.list(this.state, e);
        }
        inPendingSyncState() {
          return !this.joinRef || this.joinRef !== this.channel.joinRef();
        }
        static syncState(e, t, s, i) {
          let n = this.clone(e),
            o = {},
            r = {};
          return (
            this.map(n, (e, s) => {
              t[e] || (r[e] = s);
            }),
            this.map(t, (e, t) => {
              let s = n[e];
              if (s) {
                let i = t.metas.map((e) => e.phx_ref),
                  n = s.metas.map((e) => e.phx_ref),
                  h = t.metas.filter((e) => n.indexOf(e.phx_ref) < 0),
                  a = s.metas.filter((e) => i.indexOf(e.phx_ref) < 0);
                h.length > 0 && ((o[e] = t), (o[e].metas = h)),
                  a.length > 0 && ((r[e] = this.clone(s)), (r[e].metas = a));
              } else o[e] = t;
            }),
            this.syncDiff(n, { joins: o, leaves: r }, s, i)
          );
        }
        static syncDiff(e, { joins: t, leaves: s }, i, n) {
          let o = this.clone(e);
          return (
            i || (i = function () {}),
            n || (n = function () {}),
            this.map(t, (e, t) => {
              let s = o[e];
              if (((o[e] = t), s)) {
                let t = o[e].metas.map((e) => e.phx_ref),
                  i = s.metas.filter((e) => t.indexOf(e.phx_ref) < 0);
                o[e].metas.unshift(...i);
              }
              i(e, s, t);
            }),
            this.map(s, (e, t) => {
              let s = o[e];
              if (!s) return;
              let i = t.metas.map((e) => e.phx_ref);
              (s.metas = s.metas.filter((e) => i.indexOf(e.phx_ref) < 0)),
                n(e, s, t),
                0 === s.metas.length && delete o[e];
            }),
            o
          );
        }
        static list(e, t) {
          return (
            t ||
              (t = function (e, t) {
                return t;
              }),
            this.map(e, (e, s) => t(e, s))
          );
        }
        static map(e, t) {
          return Object.getOwnPropertyNames(e).map((s) => t(s, e[s]));
        }
        static clone(e) {
          return JSON.parse(JSON.stringify(e));
        }
      }
      class L {
        constructor(e, t) {
          (this.callback = e),
            (this.timerCalc = t),
            (this.timer = null),
            (this.tries = 0);
        }
        reset() {
          (this.tries = 0), clearTimeout(this.timer);
        }
        scheduleTimeout() {
          clearTimeout(this.timer),
            (this.timer = setTimeout(() => {
              (this.tries = this.tries + 1), this.callback();
            }, this.timerCalc(this.tries + 1)));
        }
      }
    },
  ]);
});
