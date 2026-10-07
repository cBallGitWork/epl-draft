// Evaluate a JS expression in a rendered page and print the result; settle geometry by the rendered value, not the CSS.
//
//   node tools/ui/probe.mjs <route> '<expression>' [--width 390] [--team-cookie <file>]
//
// It runs after hydration with promises awaited, and an exception in it throws here rather than printing undefined.

import { connect, parseArgs, teamCookie } from "./cdp.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const [route, expression] = positional;
if (!route || !expression) {
  console.error("usage: node tools/ui/probe.mjs <route> '<js-expression>' [--width 390] [--team-cookie <file>]");
  process.exit(1);
}

const width = Number(flags.width ?? 390);

const cdp = await connect();
await cdp.setCookie(teamCookie(flags));
await cdp.setViewport(width, 844);
await cdp.open(route, 3000);
console.log(await cdp.js(expression));
cdp.close();
