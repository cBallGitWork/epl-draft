// The CDP client every instrument stands on. It drives an ALREADY-RUNNING headless Chrome on CDP_PORT and never
// launches one, since killing a launched browser is how two agents on one machine tread on each other: start one as
// .claude/skills/shoot/SKILL.md does. BASE_URL and TEAM_COOKIE are read from the environment too.

import { readFileSync } from "node:fs";

export const CDP_PORT = process.env.CDP_PORT ?? "9261";
export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

/** The largest capture headless Chrome hands back: past about 4 Mpx (width x height x scale squared, not either side)
 *  `Page.captureScreenshot` never returns and the wedged renderer takes the next instrument down with it. */
export const CAPTURE_CEILING = 3_500_000;

const megapixels = (width, height, scale) => ((width * scale * height * scale) / 1e6).toFixed(2);

/** The requested scale, or the largest under the ceiling: stepping down keeps the same screenshot, cropping does not. */
export function fittedScale(width, height, scale) {
  let fitted = scale;
  while (fitted > 1 && width * fitted * height * fitted > CAPTURE_CEILING) fitted -= 1;
  return fitted;
}

/** The reference phone and desk the instruments measure at: viewports, not devices. */
export const PHONE = { width: 390, height: 844 };
export const DESK = { width: 1440, height: 900 };

/** The widths an audit walks every route at, both at the desk's height. */
export const AUDIT_WIDTHS = [PHONE.width, DESK.width];

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

/** The team cookie from `--team-cookie <file>` or TEAM_COOKIE, else null; never positional, since history keeps it. */
export function teamCookie(flags) {
  if (flags["team-cookie"]) return readFileSync(flags["team-cookie"], "utf8").trim();
  return process.env.TEAM_COOKIE ?? null;
}

/** The first href on `route` matching `selector`, or a loud nothing: a miss is announced, so a run that skipped
 *  routes can never report clean. Per-record routes are discovered because a written-down id is a 404 when it moves. */
export async function discover(cdp, route, selector, settle = 2200) {
  const read = async (wait) => {
    await cdp.open(route, wait);
    return cdp.js(
      `(document.querySelector('${selector}')||{}).getAttribute
         ? document.querySelector('${selector}').getAttribute("href") : ""`,
    );
  };

  // Twice, the second time four times as patient: a cold server can answer a long page slower than the first window.
  const href = (await read(settle)) || (await read(settle * 4));
  if (!href) {
    console.error(
      `  ! nothing matching ${selector} on ${route}, twice — those routes are NOT in this run.`,
    );
  }
  return href;
}

/** The team cookie on the host the instruments open: one set on localhost is never sent to 127.0.0.1. */
export function teamCookieFor(value, base) {
  return { name: "team", value, domain: new URL(base).hostname, path: "/" };
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

  /** Evaluate in the page, and throw on an exception rather than return undefined. */
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
      await send("Network.setCookie", teamCookieFor(value, process.env.BASE_URL ?? BASE_URL));
    },

    /** Viewport, with the scale stepped down if the surface would not survive capture (CAPTURE_CEILING). */
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

    /** Navigate and wait out hydration: a constant, since every readiness signal fires before hydration ends.
     *  The base is read now, not at import, so an instrument's `--base` reaches the routes it discovers. */
    open: async (route, settle = 3500) => {
      await send("Page.navigate", { url: (process.env.BASE_URL ?? BASE_URL) + route });
      await new Promise((resolve) => setTimeout(resolve, settle));
    },
  };
}
