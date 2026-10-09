// Contrast and overflow on every route at both audit widths: text under WCAG AA on its ground, and a sideways scroll.
// Text on an SVG ground is "not auditable here", a work list to check by eye and never a pass.
//   node tools/ui/sweep.mjs [--base http://localhost:3000] [--team-cookie <file>]

import { AUDIT_WIDTHS, BASE_URL, DESK, PHONE, connect, discover, parseArgs, teamCookie } from "./cdp.mjs";
import { ALL_ROUTES, FRONT_PAGE, playedMatchRoutes, playerRoutes } from "./routes.mjs";

/** This run's routes: the shared list plus the ids discovered below; a copy, so `routes.mjs` stays a declaration. */
const ROUTES = [...ALL_ROUTES];

// Each colour is painted over white and over black so the browser converts oklch(), then composited up the real ancestors.
const AUDIT = `(function(){
  var cvs=document.createElement("canvas");cvs.width=cvs.height=1;
  var ctx=cvs.getContext("2d",{willReadFrequently:true});
  var cache={};
  function toRGBA(css){
    if(cache[css])return cache[css];
    var o=[];
    ["#fff","#000"].forEach(function(ground){
      ctx.globalCompositeOperation="copy";ctx.fillStyle=ground;ctx.fillRect(0,0,1,1);
      ctx.globalCompositeOperation="source-over";ctx.fillStyle=css;ctx.fillRect(0,0,1,1);
      o.push(Array.prototype.slice.call(ctx.getImageData(0,0,1,1).data,0,3));
    });
    var a=1-(o[0][0]-o[1][0])/255;
    if(a<0)a=0; if(a>1)a=1;
    var c=a>0.002?[0,1,2].map(function(i){return o[1][i]/a}):[0,0,0];
    return cache[css]=[c,a];
  }
  function lum(c){var p=c.map(function(v){v=Math.min(255,Math.max(0,v))/255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*p[0]+0.7152*p[1]+0.0722*p[2]}
  function over(fg,bg,a){return [0,1,2].map(function(i){return fg[i]*a+bg[i]*(1-a)})}
  function bgOf(el){var n=el,stack=[],acc=[255,255,255];
    while(n&&n.nodeType===1){var t=toRGBA(getComputedStyle(n).backgroundColor);
      if(t[1]>0.002)stack.push(t);n=n.parentElement}
    for(var i=stack.length-1;i>=0;i--)acc=over(stack[i][0],acc,stack[i][1]);return acc}
  var out=[],blind=[];
  Array.prototype.forEach.call(document.querySelectorAll("*"),function(el){
    var txt="";
    Array.prototype.forEach.call(el.childNodes,function(n){if(n.nodeType===3&&n.textContent.trim())txt+=n.textContent.trim()+" "});
    txt=txt.trim(); if(!txt)return;
    var r=el.getBoundingClientRect(); if(r.width<2||r.height<2)return;
    var cs=getComputedStyle(el);
    if(cs.visibility==="hidden"||parseFloat(cs.opacity)===0)return;
    if(cs.clipPath&&cs.clipPath!=="none"&&r.width<=2)return;
    var isSvg=el.namespaceURI==="http://www.w3.org/2000/svg";
    var paint=isSvg?cs.fill:cs.color;
    if(isSvg&&(!paint||paint==="none"))return;
    var f=toRGBA(paint);
    var bg=bgOf(el);
    var col=over(f[0],bg,f[1]);
    var a=lum(col),b=lum(bg),hi=Math.max(a,b),lo=Math.min(a,b);
    var ratio=(hi+0.05)/(lo+0.05);
    var px=parseFloat(cs.fontSize),bold=parseInt(cs.fontWeight,10)>=700;
    var need=(px>=24||(px>=18.66&&bold))?3:4.5;
    if(ratio>=need-0.02)return;
    var opaque=isSvg||el.closest(".pitch");
    (opaque?blind:out).push({t:txt.slice(0,26),px:Math.round(px*10)/10,r:Math.round(ratio*100)/100,need:need});
  });
  return JSON.stringify({fail:out.slice(0,6),blind:blind.length});
})()`;

const { flags } = parseArgs(process.argv.slice(2));
if (flags.base) process.env.BASE_URL = flags.base;
const base = flags.base ?? BASE_URL;

const cdp = await connect();
await cdp.setCookie(teamCookie(flags));

// Per-record routes are discovered, never written down: their ids are the league's, FPL's or a story's, and move.
// The team, club and match bars are the app's only per-team and per-club colours, the pairs this exists to measure.
await cdp.setViewport(PHONE.width, DESK.height);
const team = await discover(cdp, "/squad", 'a[href^="/squad/"]');
if (team) ROUTES.push(team, ...["transfers", "next", "fixtures", "stats"].map((tab) => `${team}/${tab}`));

const article = await discover(cdp, FRONT_PAGE, 'a[href^="/paper/"]');
if (article) ROUTES.push(article);

const club = await discover(cdp, "/prem", 'a[href^="/prem/club/"]');
if (club) ROUTES.push(club, ...["depth", "set-pieces", "fixtures", "stats"].map((tab) => `${club}/${tab}`));

ROUTES.push(...(await playerRoutes(cdp)));

const played = await playedMatchRoutes(cdp);
ROUTES.push(...played);

// A match nobody has played is a different screen under the same two bars; the results list cannot produce one.
const coming = await discover(cdp, "/prem/fixtures", 'a[href^="/prem/match/"]');
if (coming && coming !== played[0]) ROUTES.push(coming);

let failures = 0;
for (const width of AUDIT_WIDTHS) {
  await cdp.setViewport(width, DESK.height);
  for (const route of ROUTES) {
    await cdp.send("Page.navigate", { url: base + route });
    await new Promise((resolve) => setTimeout(resolve, 2200));
    const { fail, blind } = JSON.parse(await cdp.js(AUDIT));
    // `documentElement` is null between documents; reading it threw the whole sweep away.
    const sideways = await cdp.js(
      `document.documentElement ? document.documentElement.scrollWidth > window.innerWidth : false`,
    );
    failures += fail.length + (sideways ? 1 : 0);
    const flag = [fail.length ? `${fail.length} AA` : "", sideways ? "H-SCROLL" : ""].filter(Boolean).join(" ") || "ok";
    const note = blind ? `  (${blind} on SVG ground — not auditable here, check by hand)` : "";
    console.log(`${width} ${route.padEnd(20)} ${flag}${note}`);
    for (const bad of fail) console.log(`      ${bad.r}:1 need ${bad.need} @${bad.px}px  "${bad.t}"`);
  }
}

cdp.close();
process.exit(failures ? 1 : 0);
