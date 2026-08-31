// Every tappable thing on every route, against the floor its width actually has.
//
//   node tools/ui/tapfit.mjs [--team-cookie <file>]
//
// Written on 31 Aug 2026, the day the 44px rule stopped being one number. It is
// a rule about a THUMB (PRODUCT.md): under one, 44px; above `lg`, where the
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

import { connect, parseArgs, teamCookie } from "./cdp.mjs";

const ROUTES = [
  "/",
  "/league",
  "/league/schedule",
  "/league/matchups",
  "/squad",
  "/players",
  "/matchday",
  "/matchday/desk",
  "/fpl",
];

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
    var toggle=!!n.closest('[role=group]');
    return [{t:label.slice(0,24), h:Math.round(r.height),
             known:prose||head||toggle,
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
await cdp.open("/squad", 2200);
const team = await cdp.js(
  `(document.querySelector('a[href^="/squad/"]')||{}).getAttribute
     ? document.querySelector('a[href^="/squad/"]').getAttribute("href") : ""`,
);
if (team) ROUTES.push(team);

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
