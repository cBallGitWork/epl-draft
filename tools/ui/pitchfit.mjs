// Does a pitch still fit the screen, and how much room is left.
//
//   node tools/ui/pitchfit.mjs [--team-cookie <file>]
//
// `docs/ui/squad.md` has said "measure the XI view as well as the gated one"
// since 29 Aug 2026, and every geometry change since has measured it by hand —
// which is why the numbers written into `pitch.css` were three days stale by the
// time anybody read them back. A budget nobody can re-derive in one command is a
// budget that goes wrong quietly.
//
// **The invariant is that the PITCH fits the first screen, not that the page
// does.** The page scrolls on a phone by design: the season grid is a second
// panel under the board and a reader meets it by scrolling, which is the whole
// point of a second panel. What must never happen is the grass running past the
// fold, because then a squad cannot be read at a glance — which is the one thing
// this screen exists for.
//
// **And where there is a BENCH, the bench is part of the grass** (Craig, 11 Sep
// 2026: *"pitch and sub bench need to fit the whole page"*). It measured the
// `.pitch` box only, so it reported the head-to-head board 100px clear on a
// phone where all four reserves were below the fold — the strip is a sibling of
// the pitch inside `.pitch-with-bench`, and a budget that does not know about it
// is a budget for half the object. Where a bench is drawn, `ends` is ITS bottom
// and the pitch's own is printed beside it.
//
// Every squad is walked, and most of them report no pitch: the gated board became
// a table on 31 Aug and only a squad whose lineup is public draws grass at all.
// That is not a gap in the instrument — "no pitch here" is the right answer for
// a withheld squad, and the run would be lying if it invented one. Team ids are
// discovered rather than written down; they belong to whichever league
// `FANTRAX_LEAGUE_ID` is serving.

import { connect, parseArgs, teamCookie } from "./cdp.mjs";

/** The reference phone, and the two desk sizes either side of the `lg` where the
 *  season grid moves from under the board to beside it. */
const SIZES = [
  [390, 844],
  [768, 900],
  [1024, 900],
  [1440, 900],
];

const MEASURE = `(function(){
  // **The first VISIBLE pitch, not the first one in the document.** The
  // head-to-head renders four grass nodes and hides two of them per width — the
  // phone's single side in an \`lg:hidden\` column, the desk's pair in a
  // \`hidden lg:grid\` one — so \`querySelector(".pitch")\` picked a
  // display:none node at 1024 and 1440 and reported a pitch 0px tall clearing
  // the fold by the whole screen. A hidden box has no geometry to measure and is
  // not the page's answer.
  var pitch=Array.prototype.slice.call(document.querySelectorAll(".pitch"))
    .find(function(p){return p.getBoundingClientRect().height > 0});
  if(!pitch) return JSON.stringify({none:true});
  var box=pitch.getBoundingClientRect();
  var main=document.getElementById("main");
  var read=function(name){return getComputedStyle(pitch).getPropertyValue(name).trim()};
  return JSON.stringify({
    vh:window.innerHeight,
    pitch:Math.round(box.height),
    // Where the grass ENDS against the fold. Everything above it is what the
    // page spends before a reader sees a squad.
    bottom:Math.round(box.bottom),
    page:main?Math.round(main.getBoundingClientRect().height):null,
    budget:read("--pitch-page"),
    // The reserves' strip, when the page draws one. It is the LAST element of
    // the height-budgeted block rather than the pitch, so it and not the grass
    // is what has to clear the fold.
    bench:(function(){
      var held=pitch.closest(".pitch-with-bench");
      if(!held) return null;
      var strip=held.querySelector("section.bleed");
      return strip?Math.round(strip.getBoundingClientRect().bottom):null;
    })()
  });
})()`;

const { flags } = parseArgs(process.argv.slice(2));
const cdp = await connect();
await cdp.setCookie(teamCookie(flags));

/** Every squad the served league has, in the order the list offers them: one of
 *  them is the reader's own XI and the rest are gated, and which is which is a
 *  fact about the cookie rather than about the route. */
await cdp.setViewport(390, 900);
await cdp.open("/squad", 2500);
const teams = JSON.parse(
  await cdp.js(
    `JSON.stringify(Array.prototype.slice.call(document.querySelectorAll('a[href^="/squad/"]'))
       .map(function(a){return a.getAttribute("href")}))`,
  ),
);
if (teams.length === 0) throw new Error("no squads on /squad — is the league drafted?");

// The club pitch, discovered off the table the way the club pages are elsewhere.
// It draws a PREDICTED eleven rather than a picked one, but it is the same
// grass, the same `PitchRows` card sizing and the same fold to clear — so it is
// measured with the rest or it is not measured at all.
await cdp.open("/prem", 2200);
const club = await cdp.js(
  `(document.querySelector('a[href^="/prem/club/"]')||{}).getAttribute
     ? document.querySelector('a[href^="/prem/club/"]').getAttribute("href") : ""`,
);
if (club) teams.push(club);

// **`/fpl`, and its absence is why a 552px overflow shipped.** It draws the same
// `PitchRows` on the same `.pitch` ratio and it is the ONE pitch with no second
// column beside it — so it is the one most likely to fail this, and it was the
// one route this walk never opened. Measured 5 Sep 2026 before the fix: 1,132
// wide and 1,192 tall at 1440, ending 552px past the fold, 622 of it empty grass
// under the keeper.
//
// It needs the `fpl` cookie to draw anything; without one the page is a sign-in
// form with no pitch on it, which this walk reports as "no pitch" rather than as
// a pass.
teams.push("/fpl");

// **The head-to-head board, which is the pitch this budget was written for.**
// DESIGN §9 makes it the reference page for the grass, and this walk had never
// opened it — so the one route whose bench is drawn under a scoreline and a tab
// strip was the one route nothing measured. Discovered off the matchups board
// rather than written down, because the ids belong to whichever league
// `FANTRAX_LEAGUE_ID` is serving.
await cdp.open("/league/matchups", 2500);
const tie = await cdp.js(
  `(function(a){return a?a.getAttribute("href"):""})(document.querySelector('a[href^="/league/matchups/"]'))`,
);
if (tie) teams.push(tie);

let failures = 0;
for (const route of teams) {
  for (const [width, height] of SIZES) {
    await cdp.setViewport(width, height);
    await cdp.open(route, 2500);
    const out = JSON.parse(await cdp.js(MEASURE));
    if (out.none) {
      console.log(`${route} ${width}×${height}  no pitch (withheld, or the list view)`);
      continue;
    }
    // The bench where there is one, the grass where there is not.
    const ends = out.bench ?? out.bottom;
    const spare = out.vh - ends;
    if (spare < 0) failures += 1;
    console.log(
      `${route} ${width}×${height}  pitch=${out.pitch} ends=${ends} of ${out.vh}` +
        `  ${spare < 0 ? `PAST THE FOLD by ${-spare}` : `${spare}px clear`}` +
        `   budget=${out.budget}${out.bench === null ? "" : ` (bench, grass ends ${out.bottom})`}` +
        ` page=${out.page}`,
    );
  }
}

cdp.close();
process.exit(failures ? 1 : 0);
