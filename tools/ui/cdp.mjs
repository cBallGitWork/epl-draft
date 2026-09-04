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

/** The largest surface Chrome 152 headless will actually hand back.
 *
 *  `Page.captureScreenshot` does not fail past this — it never returns, and the
 *  wedged renderer takes the NEXT instrument down with it, which is why a run
 *  used to die one tool after the one that broke it. Measured 4 Sep 2026 on a
 *  fresh browser, one capture per launch, `--headless=new --disable-gpu`:
 *
 *      1900x1900  3.61 Mpx  ok        2000x2000  4.00 Mpx  hang
 *      2048x1400  2.87 Mpx  ok        2100x2100  4.41 Mpx  hang
 *      1440x1800  2.59 Mpx  ok        2880x1800  5.18 Mpx  hang
 *
 *  So the wall sits just under 4 Mpx — a 16 MB buffer at 4 bytes a pixel — and
 *  it is the PRODUCT that matters, not the width or the height: 2880x900 is
 *  fine and 2000x2000 is not. 1440 at 2x is 5.18 Mpx, which is why the desk
 *  shot was the one that always hung.
 *
 *  PLATFORM_NOTES blamed "a second session driving the same browser". That was
 *  a coincidence of when it was first seen; it reproduces on a browser nothing
 *  else is touching. */
export const CAPTURE_CEILING = 3_500_000;

const megapixels = (width, height, scale) => ((width * scale * height * scale) / 1e6).toFixed(2);

/** The requested scale, or the largest one that still fits under the ceiling.
 *  Steps down rather than cropping, because a shorter page is a different
 *  screenshot and a less dense one is the same screenshot. */
export function fittedScale(width, height, scale) {
  let fitted = scale;
  while (fitted > 1 && width * fitted * height * fitted > CAPTURE_CEILING) fitted -= 1;
  return fitted;
}

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

/** The first href on `route` matching `selector`, or a loud nothing.
 *
 *  **Every instrument here discovers its per-record routes rather than writing
 *  them down** — a fantraxId, a club code, a fixture id and a story slug all
 *  name one row in one league's data, and a written-down one is a 404 the day
 *  that row moves.
 *
 *  What each of them did with a MISS was skip the push and carry on, and that is
 *  a silent cap: on 4 Sep 2026 a cold dev server answered `/prem`, `/players`
 *  and `/prem/results` slower than the settle window, four discoveries came back
 *  empty, and `sweep` reported `ok` on twenty routes and **exited 0** having
 *  never opened the other thirteen — including the three it had just been taught
 *  about. A green audit that covered two thirds of the app is worse than a red
 *  one, because only one of them makes anybody look.
 *
 *  So a miss is announced and counted. The caller decides whether to fail; none
 *  of them may decide to say nothing. */
export async function discover(cdp, route, selector, settle = 2200) {
  const read = async (wait) => {
    await cdp.open(route, wait);
    return cdp.js(
      `(document.querySelector('${selector}')||{}).getAttribute
         ? document.querySelector('${selector}').getAttribute("href") : ""`,
    );
  };

  // **Twice, and the second time with four times the patience.** The misses this
  // function was written to announce turned out to be a settle window rather
  // than a selector: `/players` draws 638 rows and `/prem/results` thirty-eight
  // rounds, and on a dev server that has just recompiled either can answer
  // slower than 2.2s. One retry turns the common case quiet again without
  // turning a real miss quiet with it.
  const href = (await read(settle)) || (await read(settle * 4));
  if (!href) {
    console.error(
      `  ! nothing matching ${selector} on ${route}, twice — those routes are NOT in this run.`,
    );
  }
  return href;
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

    /** Viewport, with the scale stepped down if the surface would not survive
     *  capture. See CAPTURE_CEILING — this is the one place that knows the
     *  device-pixel product, so it is the one place that can hold the line. */
    setViewport: (width, height, scale = 1) => {
      const fitted = fittedScale(width, height, scale);
      if (fitted !== scale) {
        console.warn(
          `capture ceiling: ${width}x${height} at ${scale}x is ${megapixels(width, height, scale)} Mpx — ` +
            `shooting at ${fitted}x instead. The image is a true reading of the layout at a lower density.`,
        );
      }
      return send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: fitted,
        mobile: width < 768,
      });
    },

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
