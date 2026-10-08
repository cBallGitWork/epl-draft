// Evaluate a JS expression in a rendered page after hydration, promises awaited, and print it; an exception throws
// here rather than printing undefined. Settle geometry by the rendered value, not the CSS.
//   node tools/ui/probe.mjs <route> '<expression>' [--width 390] [--team-cookie <file>]

import { PHONE, connect, parseArgs, teamCookie } from "./cdp.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const [route, expression] = positional;
if (!route || !expression) {
  console.error(`usage: node tools/ui/probe.mjs <route> '<js-expression>' [--width ${PHONE.width}] [--team-cookie <file>]`);
  process.exit(1);
}

const width = Number(flags.width ?? PHONE.width);

const cdp = await connect();
await cdp.setCookie(teamCookie(flags));
await cdp.setViewport(width, PHONE.height);
await cdp.open(route, 3000);
console.log(await cdp.js(expression));
cdp.close();
