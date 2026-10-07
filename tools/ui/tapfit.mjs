// Every tappable thing on every route, against the floor its width has (docs/rules/PRODUCT.md).
//
//   node tools/ui/tapfit.mjs [--team-cookie <file>]
//
// It names what is under the floor and never decides: the exceptions below are read out on every run, not hidden.

import { connect, discover, parseArgs, teamCookie } from "./cdp.mjs";
import { ALL_ROUTES, FRONT_PAGE, playedMatchRoutes, playerRoutes } from "./routes.mjs";

/** This run's routes: the shared list plus the ids discovered below; a copy, so `routes.mjs` stays a declaration. */
const ROUTES = [...ALL_ROUTES];

/** Under a thumb everything is 44; above `lg` a `.cm-row` row relaxes to 28 and a control to 36. */
const PHONE = 44;
const DESK_ROW = 28;
const DESK_CONTROL = 36;
/** PRODUCT.md's rows at 36 under a thumb: the match screens, `SquadRow` and the Draft tab's tables (`TIGHT_ROW`). */
const PHONE_TIGHT = 36;

// Recorded exceptions, detected by structure and never by label (a label prefix once exempted "FPL" as "FP"):
// a column head is whatever sits inside a `<th>`; an inline link inside a sentence is a link in a `<p>` with text beside it.
// A tight row declares its 36 on itself, `min-h-9` or `max-lg:min-h-9` under a thumb or `.cm-tab-compact`, and must clear 36.

/** Runs in the page. No backticks inside: it is a template literal. */
const MEASURE = `(function(){
  var nodes=Array.prototype.slice.call(
    document.querySelectorAll('a[href],button,select,input,[role=button],summary'));
  return JSON.stringify(nodes.flatMap(function(n){
    var r=n.getBoundingClientRect();
    // Nothing with no box: a screen-reader skip link is 1px until focused.
    if(!r.height||!r.width||n.closest('.sr-only')||n.classList.contains('sr-only')) return [];
    var label=(n.textContent||n.getAttribute('aria-label')||n.tagName).trim().replace(/\\s+/g," ");
    var p=n.closest('p');
    var prose=!!p && p.textContent.replace(n.textContent,"").trim().length>0;
    var head=!!n.closest('th');
    var cls=' '+(n.getAttribute('class')||'')+' ';
    var tight=cls.indexOf(' min-h-9 ')>=0||cls.indexOf(' max-lg:min-h-9 ')>=0||cls.indexOf(' cm-tab-compact ')>=0;
    return [{t:label.slice(0,24), h:Math.round(r.height),
             known:prose||head, tight:tight,
             // Either side of the element: a schedule tie wraps its row in the link, and a table row IS the link.
             row:String(n.className||"").indexOf('cm-row')>=0
                 || !!n.closest('.cm-row') || !!n.querySelector('.cm-row'),
             tag:n.tagName}];
  }));
})()`;

const { flags } = parseArgs(process.argv.slice(2));
const cdp = await connect();
await cdp.setCookie(teamCookie(flags));

// Per-record routes are discovered, never written down: their ids are the league's, FPL's or a story's, and move.
await cdp.setViewport(390, 900);
const team = await discover(cdp, "/squad", 'a[href^="/squad/"]');
if (team) ROUTES.push(team, ...["transfers", "next", "fixtures", "stats"].map((tab) => `${team}/${tab}`));

const club = await discover(cdp, "/prem", 'a[href^="/prem/club/"]');
if (club) ROUTES.push(club, ...["depth", "set-pieces", "fixtures", "stats"].map((tab) => `${club}/${tab}`));

const played = await playedMatchRoutes(cdp);
ROUTES.push(...played);

// A match nobody has played is a different screen under the same two bars; the results list cannot produce one.
const coming = await discover(cdp, "/prem/fixtures", 'a[href^="/prem/match/"]');
if (coming && coming !== played[0]) ROUTES.push(coming);

await cdp.open(FRONT_PAGE, 2200);
const article = await cdp.js(
  `(document.querySelector('a[href^="/paper/"]')||{}).getAttribute
     ? document.querySelector('a[href^="/paper/"]').getAttribute("href") : ""`,
);
if (article) ROUTES.push(article);

ROUTES.push(...(await playerRoutes(cdp)));

let failures = 0;
for (const width of [390, 1440]) {
  for (const route of ROUTES) {
    await cdp.setViewport(width, 900);
    await cdp.open(route, 2200);
    const all = JSON.parse(await cdp.js(MEASURE));
    const phone = width < 1024;
    const floor = (item) =>
      phone ? (item.tight ? PHONE_TIGHT : PHONE) : item.row ? DESK_ROW : DESK_CONTROL;
    const under = all.filter((item) => item.h < floor(item));
    const known = under.filter((item) => item.known);
    const news = under.filter((item) => !item.known);
    const tight = phone ? all.filter((item) => item.tight && !item.known && item.h >= PHONE_TIGHT && item.h < PHONE) : [];
    failures += news.length;

    const note = news.length ? `${news.length} UNDER FLOOR` : "ok";
    const recorded = [known.length ? `${known.length} recorded exceptions` : "", tight.length ? `${tight.length} rows at 36` : ""];
    const aside = recorded.some(Boolean) ? `  (${recorded.filter(Boolean).join(", ")})` : "";
    console.log(`${width} ${route.padEnd(20)} ${note}${aside}`);
    for (const item of news) console.log(`      ${item.h}px ${item.tag} "${item.t}"`);
  }
}

cdp.close();
process.exit(failures ? 1 : 0);
