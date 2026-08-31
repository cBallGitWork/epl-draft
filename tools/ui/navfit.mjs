// Does the section rail still fit on the narrowest phone anybody owns.
//
//   node tools/ui/navfit.mjs [320 360 390 430] [--team-cookie <file>]
//
// The rail replaced the tab bar on 31 Aug 2026 and the fit question turned
// ninety degrees with it. A bar fails by running out of WIDTH — six labels
// sharing one screen, and the narrowest column clips first. A rail has one
// column and fails two other ways instead, so this asks three things.
//
// **Does each label fit the rail's own width**, measured at the real rail font
// against the rendered plate. Unchanged in spirit: a clipped label is named
// rather than guessed at from a screenshot.
//
// **Does the rail fit the screen's height**, now and with one more section in
// it. The Live section exists only while football is on, so the rail a session
// sees on a Tuesday is one plate shorter than the rail sixteen phones see on a
// Saturday — the same question the bar's `+1 tab` column asked, in the axis the
// rail can actually run out of. A rail taller than the viewport scrolls inside
// itself, which is a section you cannot see without knowing to drag furniture.
//
// **What the rail leaves the page.** This is the new failure and the bar never
// had it: 64px off a 320px screen is a fifth of it, and the content column is
// where every table in the app has to fit. Reported at every width, and the
// document's own sideways scroll with it.
//
// Labels are read out of the rail rather than carried here. Its predecessor kept
// its own list of the six and the list went stale the day "Matchday" was renamed
// "Live" to buy the room.

import { connect, parseArgs, teamCookie } from "./cdp.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const widths = positional.length ? positional.map(Number) : [320, 360, 390, 430];

const MEASURE = `(function(){
  var rail=document.querySelector('nav[aria-label=Sections]');
  if(!rail) throw new Error("no section rail found — is this the app?");
  var links=Array.prototype.slice.call(rail.querySelectorAll('a[href]'));
  var items=links.filter(function(a){return a.textContent.trim()});
  if(!items.length) throw new Error("rail has no labelled sections");
  var cs=getComputedStyle(items[0]);
  var probe=document.createElement("span");
  probe.style.cssText="position:absolute;visibility:hidden;white-space:nowrap;font:"+cs.font
    +";letter-spacing:"+cs.letterSpacing+";text-transform:"+cs.textTransform;
  document.body.appendChild(probe);
  var rows=items.map(function(a){
    var r=a.getBoundingClientRect();
    probe.textContent=a.textContent.trim();
    return {t:a.textContent.trim(), box:Math.round(r.width), h:Math.round(r.height),
            needs:Math.ceil(probe.getBoundingClientRect().width),
            clipped:a.scrollWidth>Math.ceil(r.width)+1};
  });
  probe.remove();
  var rr=rail.getBoundingClientRect();
  // The plates' own run, not the rail's scrollHeight: the rail is a full-height
  // frame with the stack inside it, so its scrollHeight reports the frame back
  // whenever the stack is shorter than the screen — which is every passing case.
  var list=rail.querySelector("ul")||items[0].parentElement;
  var main=document.getElementById("main");
  return JSON.stringify({
    vw:window.innerWidth, vh:window.innerHeight, doc:document.documentElement.scrollWidth,
    rail:Math.round(rr.width), stack:Math.round(list.getBoundingClientRect().height),
    frame:Math.round(rr.height),
    page:main?Math.round(main.getBoundingClientRect().width):null,
    rows:rows});
})()`;

const cdp = await connect();
await cdp.setCookie(teamCookie(flags));

let failures = 0;
for (const width of widths) {
  await cdp.setViewport(width, 844);
  await cdp.open("/league", 2500);
  const out = JSON.parse(await cdp.js(MEASURE));

  const clipped = out.rows.filter((row) => row.clipped).map((row) => `${row.t}(${row.needs}>${row.box})`);
  // One more section is one more plate, and the tallest plate is what it costs.
  const plate = Math.max(...out.rows.map((row) => row.h));
  const overflows = out.stack > out.frame;
  const wouldOverflow = out.stack + plate > out.frame;
  failures += clipped.length + (out.doc > out.vw ? 1 : 0) + (overflows ? 1 : 0);

  console.log(
    `${width}px  viewport=${out.vw}×${out.vh} doc=${out.doc}${out.doc > out.vw ? "  H-SCROLL" : ""}` +
      `  rail=${out.rail} page=${out.page}  ${out.rows.length} sections`,
  );
  console.log(`   labels:  ${clipped.length ? `CLIPS ${clipped.join(" ")}` : "all fit"}`);
  console.log(
    `   height:  stack=${out.stack} frame=${out.frame}${overflows ? "  RAIL SCROLLS" : ""}` +
      `   +1 section (${plate}px): ${wouldOverflow ? "WOULD SCROLL" : "still fits"}`,
  );
}

cdp.close();
process.exit(failures ? 1 : 0);
