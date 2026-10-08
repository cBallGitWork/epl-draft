// Does anything on the desk print text on the bare ground? Nothing may. `sweep` cannot see it, as the ground is
// `fixed -z-10` and a contrast walk composites past it; the paper is not walked, having no photograph under it.
//   node tools/ui/groundfit.mjs [--team-cookie <file>]

import { AUDIT_WIDTHS, DESK, connect, parseArgs, teamCookie } from "./cdp.mjs";
import { DESK_ROUTES, playedMatchRoutes, playerRoutes } from "./routes.mjs";

/** This run's routes: the shared list plus the ids discovered below; a copy, so `routes.mjs` stays a declaration. */
const ROUTES = [...DESK_ROUTES];

/** Background alpha at which a thing counts as covered: `.cm-panel`, the loosest cover, is 88%; below a half is a gap. */
const COVER = 0.5;

const AUDIT = `(function(){
  var COVER = ${COVER};
  var out = [];
  // Alpha via canvas, never a regex on the computed string: Tailwind v4 computes colours to oklch().
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
    // The ground itself is aria-hidden, and a screen-reader-only label is not on the screen.
    if (el.closest("[aria-hidden='true']")) continue;
    if (el.closest(".sr-only")) continue;
    // Stop BEFORE <body>: its opaque fill propagates to the canvas, BEHIND the photograph, so it covers nothing.
    var cover = 0, node = el;
    while (node && node !== document.body) {
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

// Per-record routes are discovered, never written down: a fantraxId and a fixture id both move.
ROUTES.push(...(await playerRoutes(cdp)), ...(await playedMatchRoutes(cdp)));

let failures = 0;
for (const width of AUDIT_WIDTHS) {
  for (const route of ROUTES) {
    await cdp.setViewport(width, DESK.height);
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
