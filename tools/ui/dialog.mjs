// Open a dialog, measure it, and prove Escape closes it.
//
//   node tools/ui/dialog.mjs <route> [--selector '.pitch button'] [--width 390] [--team-cookie <file>]
//
// A dialog is the one piece of furniture a screenshot cannot check: it is absent
// from the page until something is tapped, and the failure that matters — it opens
// and will not close — leaves no trace in a still image. So the sequence is the
// test: none open, tap, one open at a measured width, Escape, none open.
//
// The width is printed rather than asserted. What counts as too wide is a design
// judgement per dialog, and a number in the output is what a reader can hold
// against docs/rules/DESIGN.md; a threshold invented here would only be this file's opinion.
//
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
// Longer than the drawer's default: an authenticated squad page is the slowest
// render in the app, and a tap dispatched before hydration hits a dead button.
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
