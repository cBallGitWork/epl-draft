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
//
// **A tab's label is its LAST `<span>`**: the first is its figure, a glyph or the Live tab's score, which is
// measured on its own. The desk rail's entries have no span and fall back to the anchor.

import { connect, parseArgs, teamCookie } from "./cdp.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const widths = positional.length ? positional.map(Number) : [320, 360, 390, 430];

const MEASURE = `(function(){
  // The visible one: both navs are in the DOM at every width and the other is display:none.
  var rail=Array.prototype.slice.call(document.querySelectorAll('nav[aria-label=Sections]'))
    .filter(function(n){return n.offsetWidth>0})[0];
  if(!rail) throw new Error("no section rail found — is this the app?");
  // A group tab (Comps) is a button that opens its fly-out; the desk rail's steppers are buttons with no aria-expanded.
  var links=Array.prototype.slice.call(rail.querySelectorAll('a[href], button[aria-expanded]'));
  var items=links.filter(function(a){return a.textContent.trim()});
  // Only the plates, and only the ones with a label: the Live plate's figure
  // lives inside the same anchor, so counting spans would double that section.
  if(!items.length) throw new Error("rail has no labelled sections");
  var labelOf=function(a){return a.querySelector(":scope > span:last-child")||a};
  var cs=getComputedStyle(labelOf(items[0]));
  var probe=document.createElement("span");
  probe.style.cssText="position:absolute;visibility:hidden;white-space:nowrap;font:"+cs.font
    +";letter-spacing:"+cs.letterSpacing+";text-transform:"+cs.textTransform;
  document.body.appendChild(probe);
  var rows=items.map(function(a){
    var r=a.getBoundingClientRect();
    var label=labelOf(a);
    // The Live tab's score, when it has one: text in the figure slot, which must fit the tab as the label does.
    var figure=a.querySelector(":scope > span:first-child");
    var score=figure&&figure!==label&&figure.textContent.trim()?figure:null;
    var lr=label.getBoundingClientRect();
    probe.textContent=label.textContent.trim();
    var ps=getComputedStyle(a);
    return {t:label.textContent.trim(), box:Math.round(r.width), h:Math.round(r.height),
            pad:Math.ceil(parseFloat(ps.paddingLeft)+parseFloat(ps.paddingRight)),
            needs:Math.ceil(probe.getBoundingClientRect().width),
            // **No tolerance term.** It was \`+1\` and that is exactly one pixel
            // too generous: \`My Team\` renders at 51 in 49.3px of room, so
            // scrollWidth 51 against ceil(49.3)+1 = 51 reported a fit while the
            // screenshot showed \`My Te…\`. \`ceil\` alone already absorbs the
            // sub-pixel case a tolerance was there for — a label 43.4 wide
            // reporting scrollWidth 44 still passes.
            clipped:label.scrollWidth>Math.ceil(lr.width)
              ||(score!==null&&score.getBoundingClientRect().width>r.width-4)};
  });
  probe.remove();
  var rr=rail.getBoundingClientRect();
  // Which way the navigation runs, read off the plates rather than assumed.
  // The app draws two shapes of it — a rail down the side of a desk screen and a
  // thumb rail across the foot of a phone (shell/ThumbRail) — and they fail on
  // different axes: down the side runs out of HEIGHT, across the foot runs out of WIDTH
  // per tab. Two tabs on the same y is a row.
  var across = items.length > 1
    && Math.abs(items[0].getBoundingClientRect().top - items[1].getBoundingClientRect().top) < 2;
  // The plates' own run, not the rail's scrollHeight: the rail is a full-height
  // frame with the stack inside it, so its scrollHeight reports the frame back
  // whenever the stack is shorter than the screen — which is every passing case.
  var list=rail.querySelector("ul")||items[0].parentElement;
  var main=document.getElementById("main");
  return JSON.stringify({
    vw:window.innerWidth, vh:window.innerHeight, doc:document.documentElement.scrollWidth,
    across:across,
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
  // **What one more section would cost, on the axis this shape actually fails
  // on.** A rail runs out of height and a foot row runs out of width per plate:
  // the same question, asked of a different measurement, and asking the rail's
  // question of a row answered "WOULD SCROLL" on a bar that cannot scroll.
  const widest = Math.max(...out.rows.map((row) => row.needs));
  // A tab's own padding, read off its computed style: the room it keeps around a label however wide it is.
  const padding = Math.max(...out.rows.map((row) => row.pad));
  const next = out.across
    ? { room: Math.floor(out.rail / (out.rows.length + 1)), needs: widest + Math.max(0, padding) }
    : null;
  const plate = Math.max(...out.rows.map((row) => row.h));
  const overflows = out.across ? false : out.stack > out.frame;
  const wouldOverflow = out.across
    ? next.room < next.needs
    : out.stack + plate > out.frame;
  failures += clipped.length + (out.doc > out.vw ? 1 : 0) + (overflows ? 1 : 0);

  console.log(
    `${width}px  viewport=${out.vw}×${out.vh} doc=${out.doc}${out.doc > out.vw ? "  H-SCROLL" : ""}` +
      `  nav=${out.across ? "thumb rail" : "rail"} ${out.rail}×${out.frame} page=${out.page}` +
      `  ${out.rows.length} sections`,
  );
  console.log(`   labels:  ${clipped.length ? `CLIPS ${clipped.join(" ")}` : "all fit"}`);
  console.log(
    out.across
      ? `   width:   plate=${Math.min(...out.rows.map((r) => r.box))} widest label=${widest}` +
        `   +1 section: ${next.room}px each vs ${next.needs} needed — ` +
        `${wouldOverflow ? "WOULD CLIP" : "still fits"}`
      : `   height:  stack=${out.stack} frame=${out.frame}${overflows ? "  RAIL SCROLLS" : ""}` +
        `   +1 section (${plate}px): ${wouldOverflow ? "WOULD SCROLL" : "still fits"}`,
  );
}

cdp.close();
process.exit(failures ? 1 : 0);
