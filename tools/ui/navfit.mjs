// Does the section rail fit the narrowest phones: each label its plate, the rail the screen now and with one more
// section (Live comes and goes), and what is left for the page. A label is its tab's LAST `<span>`, read off the rail.
//   node tools/ui/navfit.mjs [320 360 390 430] [--team-cookie <file>]

import { PHONE, connect, parseArgs, teamCookie } from "./cdp.mjs";

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
  // Only the labelled plates: the Live plate's figure sits in the same anchor, so counting spans doubles it.
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
            // No tolerance term: ceil already absorbs the sub-pixel case, and a +1 passed a clipped label.
            clipped:label.scrollWidth>Math.ceil(lr.width)
              ||(score!==null&&score.getBoundingClientRect().width>r.width-4)};
  });
  probe.remove();
  var rr=rail.getBoundingClientRect();
  // Which way the navigation runs, read off the plates: a side rail runs out of HEIGHT, a foot row of WIDTH per tab.
  var across = items.length > 1
    && Math.abs(items[0].getBoundingClientRect().top - items[1].getBoundingClientRect().top) < 2;
  // The plates' own run, not the rail's scrollHeight, which reports the full-height frame whenever the stack fits.
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
  await cdp.setViewport(width, PHONE.height);
  await cdp.open("/league", 2500);
  const out = JSON.parse(await cdp.js(MEASURE));

  const clipped = out.rows.filter((row) => row.clipped).map((row) => `${row.t}(${row.needs}>${row.box})`);
  // What one more section would cost, on the axis this shape fails on: height for a rail, width per plate for a row.
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
