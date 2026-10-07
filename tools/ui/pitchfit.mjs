// Does a pitch, and its bench where it has one, still fit the first screen, and how much room is left.
//
//   node tools/ui/pitchfit.mjs [--team-cookie <file>]
//
// The page may scroll on a phone; the grass and the bench must not run past the fold. A withheld squad draws no
// pitch, and the run says so rather than inventing one.

import { connect, parseArgs, teamCookie } from "./cdp.mjs";

/** The reference phone, and the two desk sizes either side of the `lg` where the season grid moves beside the board. */
const SIZES = [
  [390, 844],
  [768, 900],
  [1024, 900],
  [1440, 900],
];

const MEASURE = `(function(){
  // The first VISIBLE pitch: the head-to-head hides two of its four per width, and a hidden one measures 0px.
  var pitch=Array.prototype.slice.call(document.querySelectorAll(".pitch"))
    .find(function(p){return p.getBoundingClientRect().height > 0});
  if(!pitch) return JSON.stringify({none:true});
  var box=pitch.getBoundingClientRect();
  var main=document.getElementById("main");
  var read=function(name){return getComputedStyle(pitch).getPropertyValue(name).trim()};
  return JSON.stringify({
    vh:window.innerHeight,
    pitch:Math.round(box.height),
    // Where the grass ends against the fold.
    bottom:Math.round(box.bottom),
    page:main?Math.round(main.getBoundingClientRect().height):null,
    budget:read("--pitch-page"),
    // The reserves' strip, when drawn: the last of the budgeted block, so it is what must clear the fold.
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

/** Every squad the served league has; which one is the reader's own is a fact about the cookie, not the route. */
await cdp.setViewport(390, 900);
await cdp.open("/squad", 2500);
const teams = JSON.parse(
  await cdp.js(
    `JSON.stringify(Array.prototype.slice.call(document.querySelectorAll('a[href^="/squad/"]'))
       .map(function(a){return a.getAttribute("href")}))`,
  ),
);
if (teams.length === 0) throw new Error("no squads on /squad — is the league drafted?");

// The club pitch: a predicted eleven on the same grass and the same fold.
await cdp.open("/prem", 2200);
const club = await cdp.js(
  `(document.querySelector('a[href^="/prem/club/"]')||{}).getAttribute
     ? document.querySelector('a[href^="/prem/club/"]').getAttribute("href") : ""`,
);
if (club) teams.push(club);

// `/fpl`, the one pitch with no column beside it; without the `fpl` cookie it is a form and reports "no pitch".
teams.push("/fpl");

// The head-to-head board, the reference page for the grass (DESIGN §9), discovered off the matchups board.
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
