// Every tappable thing on every route, against the floor its width actually has.
//
//   node tools/ui/tapfit.mjs [--team-cookie <file>]
//
// Written on 31 Aug 2026, the day the 44px rule stopped being one number. It is
// a rule about a THUMB (docs/rules/PRODUCT.md): under one, 44px; above `lg`, where the
// pointer is a mouse, a repeating ROW relaxes to 28 and a control to 36. The
// four guards that carried the rule were prose checklists — "Are taps
// `min-h-11`?" — and a prose checklist cannot measure. The first run of this
// found the front page's new contents strip shipping 12px targets, on the one
// screen with no other way out of it.
//
// **What it does not do is decide.** It prints what is under the floor and names
// it; the exceptions below are the ones this repo has taken deliberately, and
// they are read out rather than hidden, so a run is a work list and never a
// silent pass.

import { connect, discover, parseArgs, teamCookie } from "./cdp.mjs";
import { ALL_ROUTES, matchRoutes } from "./routes.mjs";

/** This run's routes: the shared list, plus whatever `discover` finds a real
 *  id for below. A COPY, because those appends are this process's own —
 *  `routes.mjs` exports a declaration and must not become a scratchpad.
 *  All three instruments push onto this at run time. */
const ROUTES = [...ALL_ROUTES];

/** The floors, by what the thing IS rather than by what it looks like.
 *  `desk` is the relaxation `.cm-row` grants above `lg` and nothing else does. */
const PHONE = 44;
const DESK_ROW = 28;
const DESK_CONTROL = 36;

/** Taken deliberately, and read out on every run rather than filtered away.
 *
 *  **All three are detected structurally, and the first version of this file got
 *  that wrong.** It matched labels against `/^(#|Rk|Player|…|FP|…)/i`, which is
 *  anchored at the front and bounded at neither end: `FP` swallowed the rail's
 *  own **FPL**, `Player` swallowed "Player profile", `Team` swallowed "Team of
 *  the week". Any of those going under the floor was filed as a recorded
 *  exception and never reported — a guard that exempts by prefix exempts things
 *  nobody chose. `register-warden` found it on 31 Aug.
 *
 *  A **column head** belongs to the head strip it is cut from — CM's is 16px —
 *  and is as wide as its column, so it is a short wide target rather than a
 *  small one. It is whatever sits inside a `<th>`.
 *
 *  The **Pitch/List toggle** is `min-h-9` at every width, on the head-to-head
 *  board and on a locked squad. It is whatever sits inside the `role="group"`
 *  `ViewToggle` draws.
 *
 *  An **inline text link inside a sentence** is prose and not a control — "or
 *  show all 638", "tap through from Live" — and no rule has ever applied to one.
 *  It is a link inside a `<p>` with text beside it. */

const MEASURE = `(function(){
  var nodes=Array.prototype.slice.call(
    document.querySelectorAll('a[href],button,select,input,[role=button],summary'));
  return JSON.stringify(nodes.flatMap(function(n){
    var r=n.getBoundingClientRect();
    // Nothing with no box: a screen-reader-only skip link is 1px until focused,
    // and measuring it as a tap target is measuring the wrong state.
    if(!r.height||!r.width||n.closest('.sr-only')||n.classList.contains('sr-only')) return [];
    var label=(n.textContent||n.getAttribute('aria-label')||n.tagName).trim().replace(/\\s+/g," ");
    var p=n.closest('p');
    var prose=!!p && p.textContent.replace(n.textContent,"").trim().length>0;
    var head=!!n.closest('th');
    // No role=group exemption. It excused the Pitch/List toggle's min-h-9, and
    // on 11 Sep 2026 that control became a .cm-tab strip — 44 under a thumb, 56
    // above lg — so the exception it was written for stopped existing. Left in,
    // it would go on excusing a whole role=group structure and would not catch
    // the next shrink. docs/rules/PRODUCT.md's list is two now.
    // (No backticks in this block: it lives inside a template literal.)
    return [{t:label.slice(0,24), h:Math.round(r.height),
             known:prose||head,
             // Either side of the element: a schedule tie wraps its row div
             // in the link, and a table row IS the link.
             row:String(n.className||"").indexOf('cm-row')>=0
                 || !!n.closest('.cm-row') || !!n.querySelector('.cm-row'),
             tag:n.tagName}];
  }));
})()`;

const { flags } = parseArgs(process.argv.slice(2));
const cdp = await connect();
await cdp.setCookie(teamCookie(flags));

/** A real team page, discovered rather than written down: the ids are the
 *  league's and change with `FANTRAX_LEAGUE_ID`. `/squad/[teamId]` is the most
 *  visited screen in the app and a static route list cannot name it. */
await cdp.setViewport(390, 900);
const team = await discover(cdp, "/squad", 'a[href^="/squad/"]');
// And his four other screens. A team is five routes now rather than one, and an
// instrument that measures the first cannot vouch for the other four — the tab
// strip itself is a row of controls with a tap floor, and it appears on all
// five. Appended from the discovered id for the same reason the id is
// discovered: writing them down would pin them to one league.
if (team) ROUTES.push(team, ...["transfers", "next", "fixtures", "stats"].map((tab) => `${team}/${tab}`));

// A club's own screens, discovered off the table for the same reason the team's
// are discovered off `/squad`: the codes are FPL's and a written-down one names
// a 404 the season a club goes down. They are swept because the club bar is the
// app's only per-CLUB colour — twenty hexes from `clubColours`, none of them a
// token the palette has already had checked, and `inkOn` picking the ink for
// each. Point it at a pale side (Fulham, Leeds, Spurs) by hand at least once.
const club = await discover(cdp, "/prem", 'a[href^="/prem/club/"]');
if (club) ROUTES.push(club, ...["set-pieces", "fixtures", "stats"].map((tab) => `${club}/${tab}`));

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

// One article, DISCOVERED off the front page rather than written down. This list
// carried `/paper/gw2-round-report` as a literal until 4 Sep 2026, which is the
// same constant `sweep.mjs` had already been broken by and fixed: a slug names
// one story in one round's edition, so it 404s the day that story's kind is
// deleted — and a tap audit against a 404 reports a page with no controls on it
// as a page that passes.
await cdp.open("/", 2200);
const article = await cdp.js(
  `(document.querySelector('a[href^="/paper/"]:not([href="/paper/reports"]):not([href="/paper/columns"])')||{}).getAttribute
     ? document.querySelector('a[href^="/paper/"]:not([href="/paper/reports"]):not([href="/paper/columns"])').getAttribute("href") : ""`,
);
if (article) ROUTES.push(article);

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



let failures = 0;
for (const width of [390, 1440]) {
  for (const route of ROUTES) {
    await cdp.setViewport(width, 900);
    await cdp.open(route, 2200);
    const all = JSON.parse(await cdp.js(MEASURE));
    const floor = (item) =>
      width < 1024 ? PHONE : item.row ? DESK_ROW : DESK_CONTROL;
    const under = all.filter((item) => item.h < floor(item));
    const known = under.filter((item) => item.known);
    const news = under.filter((item) => !item.known);
    failures += news.length;

    const note = news.length ? `${news.length} UNDER FLOOR` : "ok";
    const aside = known.length ? `  (${known.length} recorded exceptions)` : "";
    console.log(`${width} ${route.padEnd(20)} ${note}${aside}`);
    for (const item of news) console.log(`      ${item.h}px ${item.tag} "${item.t}"`);
  }
}

cdp.close();
process.exit(failures ? 1 : 0);
