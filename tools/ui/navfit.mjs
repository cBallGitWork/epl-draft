// Does the tab bar still fit on the narrowest phone anybody owns.
//
//   node tools/ui/navfit.mjs [320 360 390 430] [--team-cookie <file>]
//
// Two measurements, because the bar can fail in two ways.
//
// What is on screen now: every tab's rendered column against the width its own
// label needs, so a clipped label is named rather than guessed at from a
// screenshot, plus whether the document scrolls sideways.
//
// What happens when one more tab arrives: the Live tab exists only while football
// is on, so the bar a session sees on a Tuesday is one column wider than the bar
// sixteen phones see on a Saturday. Each label is re-measured at the real tab font
// against the column an extra tab would leave. That question used to live in
// `matchdayfit.mjs`, which asked it by carrying its own list of the six labels —
// and the list went stale the day "Matchday" was renamed "Live" to buy the room.
// The labels are read out of the bar here for that reason.

import { connect, parseArgs, teamCookie } from "./cdp.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const widths = positional.length ? positional.map(Number) : [320, 360, 390, 430];

const MEASURE = `(function(){
  var links=Array.prototype.slice.call(document.querySelectorAll('nav[aria-label=Sections] a[href]'));
  var tabs=links.filter(function(a){return a.textContent.trim()});
  if(!tabs.length) throw new Error("no tab links found — is this the app?");
  var cs=getComputedStyle(tabs[0]);
  var probe=document.createElement("span");
  probe.style.cssText="position:absolute;visibility:hidden;white-space:nowrap;font:"+cs.font
    +";letter-spacing:"+cs.letterSpacing+";text-transform:"+cs.textTransform;
  document.body.appendChild(probe);
  var rows=tabs.map(function(a){
    var r=a.getBoundingClientRect();
    probe.textContent=a.textContent.trim();
    return {t:a.textContent.trim(), col:Math.round(r.width), needs:Math.ceil(probe.getBoundingClientRect().width),
            right:Math.round(r.right), clipped:a.scrollWidth>Math.ceil(r.width)+1};
  });
  probe.remove();
  return JSON.stringify({vw:window.innerWidth, doc:document.documentElement.scrollWidth,
    tabs:tabs.length, rows:rows});
})()`;

const cdp = await connect();
await cdp.setCookie(teamCookie(flags));

let failures = 0;
for (const width of widths) {
  await cdp.setViewport(width, 844);
  await cdp.open("/league", 2500);
  const out = JSON.parse(await cdp.js(MEASURE));

  const clipped = out.rows.filter((row) => row.clipped).map((row) => `${row.t}(${row.needs}>${row.col})`);
  // The bar is a grid of equal columns, so one more tab is one more equal share.
  const nextColumn = Math.floor(out.vw / (out.tabs + 1));
  const tight = out.rows.filter((row) => row.needs > nextColumn).map((row) => `${row.t}(${row.needs})`);
  failures += clipped.length + (out.doc > out.vw ? 1 : 0);

  console.log(
    `${width}px  viewport=${out.vw} doc=${out.doc}${out.doc > out.vw ? "  H-SCROLL" : ""}` +
      `  ${out.tabs} tabs  rightmost=${out.rows.at(-1).right}`,
  );
  console.log(`   now:  ${clipped.length ? `CLIPS ${clipped.join(" ")}` : "all labels fit"}`);
  console.log(
    `   +1 tab (${nextColumn}px columns):  ` +
      (tight.length ? `WOULD CLIP ${tight.join(" ")}` : "all labels still fit"),
  );
}

cdp.close();
process.exit(failures ? 1 : 0);
