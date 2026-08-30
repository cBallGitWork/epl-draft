// Evaluate a JS expression in a rendered page and print the result.
//
//   node tools/ui/probe.mjs <route> '<expression>' [--width 390] [--team-cookie <file>]
//
// The expression runs after hydration with promises awaited, and an exception
// in it THROWS here rather than printing undefined — an empty `{}` from a
// swallowed page error once sent a session down a wrong path for half an hour.
//
// This is how a claim about geometry gets settled: measure the rendered value
// (`getComputedStyle(...).fontSize`, `scrollHeight - clientHeight`), never the
// CSS that was written.

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
