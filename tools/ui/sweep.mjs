// Contrast and overflow across every route, at both widths.
//
//   node tools/ui/sweep.mjs [--base http://localhost:3000] [--team-cookie <file>]
//
// Nine routes × 390 and 1440. Two questions per page: does any text fail WCAG AA
// against the ground it is actually painted on, and does the document scroll
// sideways.
//
// The colour arithmetic is the part worth keeping. This app authors in oklch, and
// `getComputedStyle` hands oklch() straight back — so the ratio cannot be done in
// JS on the string. Painting the colour once over white and once over black lets
// the browser do the conversion and recovers both the alpha and the sRGB, whatever
// space it was written in. Backgrounds are composited up the real ancestor chain
// for the same reason: a token at 60% over a card over the navy ground is three
// layers, and reading only the nearest one flatters every figure on the page.
//
// Text on an SVG ground is bucketed as "not auditable here" rather than failed.
// The pitch draws its own ground in SVG, which no ancestor walk can see; calling
// that a failure trains the reader to ignore the output, which is worse than the
// gap. The bucket is a work list — check those by eye — never a pass.

import { BASE_URL, connect, discover, parseArgs, teamCookie } from "./cdp.mjs";
import { ALL_ROUTES, matchRoutes } from "./routes.mjs";

/** This run's routes: the shared list, plus whatever `discover` finds a real
 *  id for below. A COPY, because those appends are this process's own —
 *  `routes.mjs` exports a declaration and must not become a scratchpad. */
const ROUTES = [...ALL_ROUTES];


const WIDTHS = [390, 1440];

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

// A team's own five screens, discovered rather than written down — the ids are
// the league's and change with `FANTRAX_LEAGUE_ID`, so a static list would name
// a 404 the day the app is pointed at the real league. `tapfit` discovers its
// team page the same way and for the same reason.
//
// They are swept because they are where the app's only per-team COLOUR is: a
// title bar and a match header drawn in a team's own hex rather than in a token
// the palette has already had checked. That is exactly the kind of pair this
// instrument exists to measure, and no other route in the list has one.
await cdp.setViewport(390, 900);
const team = await discover(cdp, "/squad", 'a[href^="/squad/"]');
if (team) ROUTES.push(team, ...["transfers", "next", "fixtures", "stats"].map((tab) => `${team}/${tab}`));

// One article, DISCOVERED off the front page rather than written down. It was
// `/paper/gw2-round-report` until 3 Sep 2026, which broke the sweep outright the
// day the round-report kind was deleted: the slug still parses, the story no
// longer normalizes, the route 404s, and the audit crashed rather than reporting
// a failure. A slug names one story in one round's edition and is the last thing
// that should be a constant here — every other per-record route in this list is
// already derived for exactly that reason.
await cdp.open("/", 2200);
const article = await cdp.js(
  `(document.querySelector('a[href^="/paper/"]:not([href="/paper/reports"]):not([href="/paper/columns"])')||{}).getAttribute
     ? document.querySelector('a[href^="/paper/"]:not([href="/paper/reports"]):not([href="/paper/columns"])').getAttribute("href") : ""`,
);
if (article) ROUTES.push(article);

// A club's own screens, discovered off the table for the same reason the team's
// are discovered off `/squad`: the codes are FPL's and a written-down one names
// a 404 the season a club goes down. They are swept because the club bar is the
// app's only per-CLUB colour — twenty hexes from `clubColours`, none of them a
// token the palette has already had checked, and `inkOn` picking the ink for
// each. Point it at a pale side (Fulham, Leeds, Spurs) by hand at least once.
const club = await discover(cdp, "/prem", 'a[href^="/prem/club/"]');
if (club) ROUTES.push(club, ...["depth", "set-pieces", "fixtures", "stats"].map((tab) => `${club}/${tab}`));

// One player's four screens, DISCOVERED off the pool rather than written down,
// for the reason the team's and the club's are: a `fantraxId` names one man in
// one league's pool, and a written-down one is a 404 the day he leaves. They are
// swept because the player bar is a per-CLUB colour like the club's, and
// because the attribute grid is the densest type on the desk — `xs` labels
// against `--color-muted`, which is the pair a contrast sweep exists for.
// **`tbody`, and that is not decoration.** The bare selector took the first
// `/players/` link on the page, which from 6 Sep 2026 is the second tab in
// Find's own strip — so these instruments walked `/players/analysis/data` and
// friends, which resolve to the PLAYER route with a `fantraxId` of "analysis",
// and stopped covering a real player screen at all. A man is a row of the
// directory, so the directory's body is where to look for one.
//
// The tab was called Compare and the route was `/players/compare` when this was
// first written down; the trap is the same whatever the tab is called, which is
// why the fix is the selector and not the name.
const man = await discover(cdp, "/players", 'tbody a[href^="/players/"]');
if (man) ROUTES.push(man, ...["data", "news", "transfer", "data?season=all"].map((tab) => `${man}/${tab}`));

// One match's two screens, discovered off the results list — where the score
// became a link on 4 Sep 2026 and had never been one before. A written-down
// fixture id is a 404 next August, and unlike a club code it is a 404 the same
// season: `Fixture.id` is per-season and so is the fixture.
//
// Swept because the match bar is the app's only place TWO club colours meet, and
// `inkOn` has to answer for both of them at once — the pale-side case
// (`cm9900/16.jpg` runs Everton against a white Torquay) is a real pairing and
// not an edge. The Players board carries the same pair over two column heads.
const match = await discover(cdp, "/prem/results", 'a[href^="/prem/match/"]');
// Every tab the match has, read off the app's folders (`matchRoutes`), so none ships unmeasured.
if (match) ROUTES.push(...matchRoutes(match));

// And a match nobody has played, which is a different screen under the same
// two bars: no scoresheet, a `v` where the score goes, and the Players tab
// greyed. The results list cannot produce one, so it takes its own read.
const coming = await discover(cdp, "/prem/fixtures", 'a[href^="/prem/match/"]');
if (coming && coming !== match) ROUTES.push(coming);

// The player page a club's squad list links to, discovered off the club page for
// the same reason the club is discovered off the table.
if (club) await cdp.open(club, 2200);
const linked = await cdp.js(
  `(function(){
     var out = {};
     var p = document.querySelector('a[href^="/prem/player/"]');
     if (p) out.player = p.getAttribute("href");
     return JSON.stringify(out);
   })()`,
);
const player = JSON.parse(linked || "{}").player;
if (player) ROUTES.push(player);


let failures = 0;
for (const width of WIDTHS) {
  await cdp.setViewport(width, 900);
  for (const route of ROUTES) {
    await cdp.send("Page.navigate", { url: base + route });
    await new Promise((resolve) => setTimeout(resolve, 2200));
    const { fail, blind } = JSON.parse(await cdp.js(AUDIT));
    // `document.documentElement` is null for the instant a navigation is
    // between documents, and reading `.scrollWidth` off it threw the whole
    // sweep away — one unsettled route and no report at all, for the routes
    // before it as well as after. Answered as "not measurable" instead.
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
