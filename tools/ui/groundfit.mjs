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

import { connect, discover, parseArgs, teamCookie } from "./cdp.mjs";

/** The desk. `/` is the paper and has no ground to sit on. */
const ROUTES = [
  "/league",
  "/league/schedule",
  "/league/results",
  "/league/team-stats",
  "/league/matchups",
  "/squad",
  "/players",
  // Scout's second view. Its two ids are in the QUERY rather than the path, so
  // `discover` cannot reach it by following a link off the board — the board
  // only links here once a first man has been chosen. Two real ids, like every
  // other fixed entry in this list.
  "/players/analysis?a=05gcr&b=03ksl",
  "/matchday",
  "/matchday/desk",
  "/fpl",
  // The manager's inbox, added with the section on 5 Sep 2026. A route this
  // list does not name is a route that ships unmeasured.
  "/news",
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
    // **Stop BEFORE <body>, and this is the whole instrument.** The walk used to
    // run to <html>, which meant it counted body's own background — and
    // globals.css gives body an opaque --color-bg. So cover reached 1.00 for
    // every text node on every desk route and this audit could not fail; its
    // "Zero bare, 31 Aug 2026" was vacuous, and DESIGN §2 rests the photograph
    // reversal on that number.
    //
    // The render is the other way round: <html> is transparent, so body's
    // background propagates to the CANVAS, and PhotoGround's fixed inset-0
    // -z-10 paints above the canvas background. That is why the photograph is
    // visible at all. Body's fill is therefore BEHIND the picture and covers
    // nothing; only a background between the text and the photograph does.
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

// One player's four screens, DISCOVERED off the pool for the reason the team's
// and the club's are: a `fantraxId` names one man in one league's pool, and a
// written-down one is a 404 the day he leaves.
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
if (man) ROUTES.push(man, ...["data", "news", "transfer", "history"].map((tab) => `${man}/${tab}`));

// One match's two screens, discovered off the results list — where the score
// became a link on 4 Sep 2026 and had never been one before. A written-down
// fixture id is a 404 the same season, because `Fixture.id` is per-season and so
// is a fixture.
//
// Walked because the match bar prints two club names as DISPLAY type straight
// onto a club colour, and the Players board prints two more over its column
// heads. Four strings on four grounds none of which is a token this instrument
// has already had checked.
const match = await discover(cdp, "/prem/results", 'a[href^="/prem/match/"]');
// All four of the match's tabs. Two arrived on 5 Sep 2026 — Player Stats came
// off the Overview and the Match Report is the Premier League's own commentary
// — and a tab this list does not name is a tab that ships unmeasured.
if (match) ROUTES.push(match, `${match}/stats`, `${match}/players`, `${match}/report`);


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
