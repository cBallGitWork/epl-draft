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
  var pitch=document.querySelector(".pitch");
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
    bench:pitch.closest(".pitch-with-bench")!==null
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
    const spare = out.vh - out.bottom;
    if (spare < 0) failures += 1;
    console.log(
      `${route} ${width}×${height}  pitch=${out.pitch} ends=${out.bottom} of ${out.vh}` +
        `  ${spare < 0 ? `PAST THE FOLD by ${-spare}` : `${spare}px clear`}` +
        `   budget=${out.budget}${out.bench ? " (bench)" : ""} page=${out.page}`,
    );
  }
}

cdp.close();
process.exit(failures ? 1 : 0);
