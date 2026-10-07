// Open a dialog, measure it, and prove Escape closes it: none open, tap, one open at a measured width, Escape, none.
//
//   node tools/ui/dialog.mjs <route> [--selector '.pitch button'] [--width 390] [--team-cookie <file>]
//
// The width is printed, not asserted: too wide is a judgement per dialog against docs/rules/DESIGN.md.
// Exits non-zero when the dialog never opens, or opens and survives Escape.

import { connect, parseArgs, teamCookie } from "./cdp.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const [route] = positional;
if (!route) {
  console.error("usage: node tools/ui/dialog.mjs <route> [--selector '.pitch button'] [--width 390] [--team-cookie <file>]");
  process.exit(1);
}

const selector = flags.selector ?? ".pitch button";
const width = Number(flags.width ?? 390);
const openCount = `document.querySelectorAll("dialog[open]").length`;

const cdp = await connect();
await cdp.setCookie(teamCookie(flags));
await cdp.setViewport(width, 844);
// Longer than the default: a signed-in squad page is the slowest render, and a tap before hydration hits a dead button.
await cdp.open(route, 6000);

const before = await cdp.js(openCount);
console.log(`before   ${before} open`);

await cdp.js(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});
  if(!el) throw new Error("no element matches ${selector.replace(/"/g, '\\"')}");
  el.click();})()`);
await new Promise((resolve) => setTimeout(resolve, 900));

const opened = await cdp.js(`(()=>{const d=document.querySelector("dialog[open]");
  return d ? "OPEN · width " + Math.round(d.getBoundingClientRect().width) + "px · " + (d.textContent||"").trim().slice(0,28) : "none";})()`);
console.log(`on tap   ${opened}`);

for (const type of ["keyDown", "keyUp"]) {
  await cdp.send("Input.dispatchKeyEvent", { type, key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
}
await new Promise((resolve) => setTimeout(resolve, 700));

const after = await cdp.js(openCount);
console.log(`escape   ${after} open`);

cdp.close();
const failed = opened === "none" || after > 0;
if (failed) console.error(opened === "none" ? "FAIL: nothing opened" : "FAIL: dialog survived Escape");
process.exit(failed ? 1 : 0);
