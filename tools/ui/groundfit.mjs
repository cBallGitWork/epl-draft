// Does anything on the desk print text on the bare ground?
//
//   node tools/ui/groundfit.mjs [--team-cookie <file>]
//
// Written on 31 Aug 2026, the day the photograph came back at full strength.
// The old scrim was solved as a CONTRAST BOUND — a statement about the worst
// pixel a photograph could contain, holding for ink sitting directly on it —
// and at opacity 0.30 over brightness 0.25 that bound left about seven per cent
// of a picture. Championship Manager does not pay that price because it never
// takes the risk: every word in the game is on a plate or inside a translucent
// panel, and the ground is only ever seen between them.
//
// So the desk swapped a bound for a rule — **nothing prints text on the bare
// ground** — and this measures the rule. It is the one guarantee `sweep` cannot
// give: the ground is `fixed` at `-z-10`, an ancestor of nothing, so sweep
// composites straight past it and calls every route clean whatever is behind
// it. A rule that no instrument checks is a hope, and the docblock on
// `PhotoGround`'s constants points here rather than quoting a number.
//
// The paper is not swept. It is ink on stock with no photograph under it, and
// `isPaperRoute` is what stands the ground down.

import { connect, parseArgs, teamCookie } from "./cdp.mjs";

/** The desk. `/` is the paper and has no ground to sit on. */
const ROUTES = [
  "/league",
  "/league/schedule",
  "/league/matchups",
  "/squad",
  "/players",
  "/matchday",
  "/matchday/desk",
  "/fpl",
];

/** Accumulated background alpha at which a thing counts as covered.
 *
 *  Half, and the number is not arbitrary: the loosest cover the desk uses on
 *  purpose is `.cm-panel`, which is `--color-surface` at 88%. Anything below a
 *  half is not a translucent panel, it is a gap — and a gap is where the
 *  photograph is meant to show. */
const COVER = 0.5;

const AUDIT = `(function(){
  var COVER = ${COVER};
  var out = [];
  // Alpha via canvas, never a regex on the computed string. Tailwind v4
  // computes its colours to oklch(), so matching /rgba?\\(/ reports every
  // opaque plate in the app as transparent — which is how the first run of
  // this called <span class="bg-accent"> bare ground, on all eight routes.
  var cvs=document.createElement("canvas");cvs.width=cvs.height=1;
  var ctx=cvs.getContext("2d",{willReadFrequently:true});
  var acache={};
  function alphaOf(css){
    if(css in acache) return acache[css];
    var o=[];
    ["#fff","#000"].forEach(function(g){
      ctx.globalCompositeOperation="copy";ctx.fillStyle=g;ctx.fillRect(0,0,1,1);
      ctx.globalCompositeOperation="source-over";ctx.fillStyle=css;ctx.fillRect(0,0,1,1);
      o.push(ctx.getImageData(0,0,1,1).data[0]);
    });
    var a = 1 - (o[0]-o[1])/255;
    if(!isFinite(a)||a<0)a=0; if(a>1)a=1;
    acache[css]=a; return a;
  }
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  var seen = {};
  var n;
  while ((n = walker.nextNode())) {
    var t = (n.textContent||"").trim();
    if (!t) continue;
    var el = n.parentElement;
    if (!el) continue;
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    var cs0 = getComputedStyle(el);
    if (cs0.visibility === "hidden" || cs0.opacity === "0") continue;
    // The ground itself is aria-hidden, and a screen-reader-only label is not
    // on the screen at all.
    if (el.closest("[aria-hidden='true']")) continue;
    if (el.closest(".sr-only")) continue;
    var cover = 0, node = el;
    while (node && node !== document.documentElement) {
      var cs = getComputedStyle(node);
      var a = alphaOf(cs.backgroundColor);
      if (cs.backgroundImage && cs.backgroundImage !== "none") a = 1;
      if (a > 0) cover = cover + (1 - cover) * a;
      if (cover >= COVER) break;
      node = node.parentElement;
    }
    if (cover >= COVER) continue;
    var key = el.tagName + "|" + t.slice(0,40);
    if (seen[key]) continue;
    seen[key] = 1;
    out.push({
      text: t.slice(0,50),
      tag: el.tagName.toLowerCase(),
      cls: (el.className||"").toString().slice(0,80),
      cover: +cover.toFixed(2),
    });
  }
  return JSON.stringify(out.slice(0,40));
})()`;

const { flags } = parseArgs(process.argv.slice(2));
const cdp = await connect();
await cdp.setCookie(teamCookie(flags));

let failures = 0;
for (const width of [390, 1440]) {
  for (const route of ROUTES) {
    await cdp.setViewport(width, 900);
    await cdp.open(route, 2200);
    const bare = JSON.parse(await cdp.js(AUDIT));
    failures += bare.length;
    console.log(`${width} ${route.padEnd(20)} ${bare.length ? `${bare.length} ON THE BARE GROUND` : "ok"}`);
    for (const hit of bare) {
      console.log(`      cover ${hit.cover}  <${hit.tag}> ${JSON.stringify(hit.text)}`);
      console.log(`             ${hit.cls}`);
    }
  }
}

cdp.close();
process.exit(failures ? 1 : 0);
