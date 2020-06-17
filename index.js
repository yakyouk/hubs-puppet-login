"use strict";
require("dotenv").config();
const doAuth = require("./utils/verify-auth");
const { spawn } = require("child_process");

const YOGO = process.env.YOGO;
const SENDERS = process.env.AUTH_SENDERS
  ? process.env.AUTH_SENDER.split(",")
  : [];
const EMAILS = process.env.BOT_EMAILS.split(",");

const emailsMap = new Map(
  EMAILS.map((e) => [e, { lastId: "", ids: new Set() }])
);
(async () => {
  for (;;) {
    //loop on addresses
    for (const email of EMAILS) {
      console.log(`Checking inbox: '${email}'`);
      const thisEmail = emailsMap.get(email);
      //loop till we don't get pushed down by new mails
      for (;;) {
        const newMailIds = new Set();
        let i = 1;
        let isPushedDown = false;
        //loop till we don't find new mails
        for (;;) {
          await new Promise((r) => setTimeout(r, 200));
          let { code, stdout, stderr } = await run(
            YOGO,
            ["inbox", "show", email, `${i}`, "--json"],
            { title: email, stdout: false, stderr: false }
          );
          //some error, check stderr for specifics
          if (code) {
            //no more mails
            if (stderr.startsWith(`panic: runtime error: index out of range`)) {
              break;
            }
            //unexpected error, try again
            console.error(`ERROR: ${code} ${stderr}`);
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          //   console.log(stdout);
          if (stdout.startsWith("Inbox is empty")) {
            console.log("Empty");
            break;
          }
          let data;
          try {
            data = JSON.parse(stdout);
          } catch (e) {
            //unexpected error, try again
            console.error(`ERROR: ${e} ${stdout}`);
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          //not a whitelisted sender, ignore
          if (SENDERS.length && !SENDERS.includes(data.sender.mail)) {
            i++;
            continue;
          }
          //reached old mails
          if (thisEmail.ids.has(data.id)) {
            break;
          }
          //already treated here! the list got pushed down
          if (newMailIds.has(data.id)) {
            isPushedDown = true;
            i++;
            continue;
          }
          //found untreated email
          newMailIds.add(data.id);
          doMail(data).then(({ res, err }) => {
            if (res) console.log("auth succeeded");
            else console.log("auth failed", err);
          });
        }
        //add set of new mails to old ones
        for (const id of newMailIds) thisEmail.ids.add(id);
        if (!isPushedDown) break;
      }
      console.log("No more emails.");
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
})();

function doMail(data) {
  console.log(`New mail: '${data.id}'`);
  const r = data.body.match(/https?:\/\/\S+/);
  if (!r) return { res: false, err: e };
  return doAuth(r[0]);
}

function run(cmd, args, opts) {
  let stdout = "";
  let stderr = "";
  //   console.log(`${opts.title}: RUN`);
  let resolver, rejecter;
  const p = new Promise((r, R) => {
    resolver = r;
    rejecter = R;
  });
  let state = "";
  const shell = spawn(cmd, args);
  //   const shell = spawn("cmd", ["/c", "run.bat r"]);
  shell.stdout.on("data", (data) => {
    const d = `${data}`;
    stdout += d;
    if (opts.stdout) {
      console.log(
        `> ${opts.title}: ${
          d.substr(-1) === "\n" ? d.substr(0, d.length - 1) + " <" : d
        }`
      );
    }
  });
  shell.stderr.on("data", (data) => {
    const d = `${data}`;
    stderr += d;
    if (opts.stderr) {
      console.error(
        `> ${opts.title}: ${
          d.substr(-1) === "\n" ? d.substr(0, d.length - 1) + " <" : d
        }`
      );
    }
  });
  shell.on("error", (error) => {
    console.error(`${opts.title} ERROR: ${error.message}`);
  });
  shell.on("close", (code) => {
    resolver({ code, state, stdout, stderr });
  });
  return p;
}
