// The shared CDP client every instrument in this drawer stands on.
//
// Five scripts each carried their own copy of this harness before it existed —
// the WebSocket, the id counter, the send/evaluate pair — which is the rule of
// 2/3 satisfied five times over. What lives here is only what they all need;
// anything one instrument wants stays in that instrument.
//
// Talks to an ALREADY-RUNNING headless Chrome. Launching is deliberately not
// this module's job: a launched browser must also be killed, and the killing is
// where two agents sharing one machine tread on each other. Start one with:
//
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --disable-gpu --remote-debugging-port=$CDP_PORT \
//     --no-first-run --user-data-dir=<fresh dir> about:blank &
//
// Environment: CDP_PORT (default 9261 — the port this repo has always used,
// recorded in PLATFORM_NOTES), BASE_URL (default http://localhost:3000),
// TEAM_COOKIE (a signed team cookie value, for routes that personalise).

import { readFileSync } from "node:fs";

export const CDP_PORT = process.env.CDP_PORT ?? "9261";
export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

/** `--flag value` pairs pulled out of argv; positionals returned in order. */
export function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) flags[argv[i].slice(2)] = argv[++i] ?? "";
    else positional.push(argv[i]);
  }
  return { flags, positional };
}

/** The team cookie, from `--team-cookie <file>` or the TEAM_COOKIE env — or
 *  null, because most routes render fine anonymous and the instruments should
 *  too. Never a positional argument: a cookie in a shell history is a session. */
export function teamCookie(flags) {
  if (flags["team-cookie"]) return readFileSync(flags["team-cookie"], "utf8").trim();
  return process.env.TEAM_COOKIE ?? null;
}

export async function connect() {
  const targets = await (await fetch(`http://localhost:${CDP_PORT}/json`)).json();
  const page = targets.find((t) => t.type === "page");
  if (!page) throw new Error(`no page target on CDP port ${CDP_PORT} — is headless Chrome running?`);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", () => reject(new Error(`cannot open CDP websocket on ${CDP_PORT}`)));
  });

  let id = 0;
  const send = (method, params) =>
    new Promise((resolve) => {
      const mine = ++id;
      const on = (event) => {
        const message = JSON.parse(event.data);
        if (message.id === mine) {
          ws.removeEventListener("message", on);
          resolve(message.result);
        }
      };
      ws.addEventListener("message", on);
      ws.send(JSON.stringify({ id: mine, method, params }));
    });

  /** Evaluate in the page and throw on an exception rather than returning
   *  undefined — a silent undefined cost a whole wrong conclusion once. */
  const js = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails).slice(0, 400));
    return result.result.value;
  };

  return {
    send,
    js,
    close: () => ws.close(),

    /** Cookie before viewport before navigate — the order every caller wants. */
    setCookie: async (value) => {
      if (value === null) return;
      await send("Network.enable", {});
      await send("Network.setCookie", { name: "team", value, domain: "localhost", path: "/" });
    },

    setViewport: (width, height, scale = 1) =>
      send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: scale,
        mobile: width < 768,
      }),

    /** Navigate and give hydration time to finish. The wait is a constant
     *  rather than a readiness probe on purpose: every readiness signal this
     *  app emits arrives before the client components have hydrated, and 3.5s
     *  was measured as enough on the slowest route. */
    open: async (route, settle = 3500) => {
      await send("Page.navigate", { url: BASE_URL + route });
      await new Promise((resolve) => setTimeout(resolve, settle));
    },
  };
}
