// How the app is actually divided, as data.
//
// One table, because two registers print it: the desk's rail and the paper's
// index. A list of section names copied into both would drift, and this is the
// exact drift `navfit.mjs` already reads its labels out of the DOM to avoid —
// its predecessor carried its own copy of the six and went stale the day
// "Matchday" was renamed "Live".
//
// No JSX and no `"use client"`: the rail is a client component and the paper's
// index is a server one, and a plain table crosses that line without either of
// them having to care. Both modules it imports keep the same discipline, for
// the same reason — see `prem/routes.ts`.

import { POOL } from "../../players/routes";
import { CLUB, MATCH } from "../../prem/routes";
import { MY_TEAM, SQUAD } from "../../squad/routes";
import type { GlyphName } from "./glyphs";

/** The paper's territory: the front page, and the pages behind it.
 *
 *  **This reverses the 31 Aug reversal, on Craig's word (2 Sep).** Inside pages
 *  were built here on 31 Aug and reverted the same day, and the argument then
 *  was sound: a second paper route grew a folio and a contents strip, which
 *  meant printing the desk's own six section names in newsprint, twice over,
 *  under a page whose top line read "Matches" where a masthead belongs.
 *
 *  What changed is that the paper now has something to put on them. On 31 Aug
 *  nothing had ever been filed, so an inside page was furniture with no
 *  articles behind it; a folio numbering empty sections is numbering the app.
 *  The paper files real columns now, a front page cannot hold them all, and a
 *  headline that opens in place is a headline that can never be linked to.
 *
 *  The revert's two complaints are answered rather than ignored. The desk's
 *  six names print once, in `Index`, exactly as before — the paper's own strip
 *  (`Pages`) lists the paper's pages and nothing else, in different dress. And
 *  an inside page opens on `Folio`, which leads with THE GAZETTA and puts the
 *  section and its number beneath, so a masthead is never displaced by a word
 *  like "Matches".
 *
 *  Still true, and still the rule: extra MATERIAL — the draft table, the
 *  Premier League table, the charts — belongs in sections on the front page.
 *  What lives behind a page is an ARTICLE. */
const PAPER_ROUTES = ["/", "/paper"];

/** Each section owns a set of routes, not just the one it links to: a manager
 *  reading a squad or a past gameweek is still in that section, and navigation
 *  that goes blank as soon as you tap into a detail page has stopped saying
 *  where you are. */
/** **Squads is not a section** (Craig, 2 Sep: "I think we can remove the squads
 *  icon in nav bar, it's redundant with accessing the squads via the league
 *  anyways"). He is right about the redundancy and the reference agrees about
 *  the principle: Championship Manager's rail is "where you can go from
 *  anywhere" — Competitions, Nations & Clubs, Find — and a CLUB is never on it,
 *  because you reach a club through the competition it plays in. A squad is our
 *  club screen and every route into it is a team name somebody tapped: the
 *  league table, the schedule, results, team stats, the matchup board, a
 *  player's profile. Eight of them, counted.
 *
 *  `/squad` itself still exists and still works — the index is a real page and
 *  the sign-in lives on it. It is simply not a destination the rail offers,
 *  which is the difference between a route and a section.
 *
 *  **My Team is, and it is the other half of that ruling rather than a reversal
 *  of it** (Craig, 21 Sep 2026: "MY TEAM section"). Ten squads reached through
 *  the competition is what was redundant; YOUR one is not one of the ten, and
 *  the reference is explicit about it — CM's rail runs `Continue Game · <the
 *  manager's own name> · Competitions · Nations & Clubs · Find`, so the thing
 *  you manage sits second, above the competitions, and everybody else's club is
 *  reached through them. Ours sat nowhere: an app that knows whose team you are
 *  made you find yourself in a table of ten to get to it. */
export interface Section {
  href: string;
  label: string;
  routes: string[];
  /** Only while football is on. The Live section and nothing else. */
  onlyDuringGameweek?: boolean;
  /** The glyph over its word on the phone's rail; a section that is always behind More has none. */
  glyph?: GlyphName;
  /** Its full name where a row has room for it, as More's page does. */
  fullLabel?: string;
  /** Behind `More` on a phone, flat on the desk rail: six tabs at 320 leave a label 49px (DESIGN §2). */
  overflow?: boolean;
  /** Behind `More` only while football is on, because Live takes its slot (Craig, 21 Sep 2026). */
  overflowDuringGameweek?: boolean;
}

/** The manager's inbox, labelled Mail. */
export const MAIL = "/news";

export const SECTIONS: Section[] = [
  { href: "/", label: "Gazetta", glyph: "gazetta", routes: PAPER_ROUTES },
  // **One route and not a prefix**, which is what keeps the plate honest: it
  // owns `/squad/me`, so it lights across all five of the reader's own tabs and
  // stays dark on a rival's screens. `squad/routes.ts` records why the front
  // door is a URL rather than a redirect to an id.
  // **`Team` and not `My Team`, and it is the ceiling's answer rather than a
  // preference.** At 320 a plate is 53.3px and keeps 4px around its label, so a
  // label has 49.3 — and `My Team` renders at 51. It shipped as that for one
  // afternoon and the screenshot read `My Te…`; `navfit` had called it a fit,
  // because its clipped test carried a `+1` tolerance that was exactly one pixel
  // too generous. The instrument is fixed and this is the word that fits.
  //
  // The SECTION is still My Team everywhere it is written about. A plate is not
  // the place a name is stated in full — `Prem` is `FA Barclays Premiership` on
  // the title bar two lines below it, for the same reason.
  {
    href: MY_TEAM,
    label: "Team",
    fullLabel: "My Team",
    glyph: "team",
    routes: [MY_TEAM],
    overflowDuringGameweek: true,
  },
  // Live takes Team's slot while football is on, so the second tab is always yours.
  { href: "/matchday", label: "Live", glyph: "live", routes: ["/matchday", "/gw"], onlyDuringGameweek: true },
  { href: "/league", label: "League", glyph: "league", routes: ["/league"] },
  // **"Prem", and the bar says the rest.** The rail is 64px below `lg` and
  // "Gazetta" already measures 45px of it at 9px bold uppercase, so
  // "Premiership" wraps to two lines and a rail plate taller than its
  // neighbours is not a rail. The title bar carries "FA Barclays Premiership"
  // in full, which is where a competition's name belongs (`cm9900/24.jpg`).
  //
  // Beside League, because the competition sits beside the competition: one is
  // the fantasy league we play and the other is the football it is played on,
  // and a reader moving between them is asking the same question twice.
  { href: "/prem", label: "Prem", glyph: "prem", routes: ["/prem"] },
  // **The manager's inbox, and it is a section rather than a tab** (Craig, 5 Sep
  // 2026: "Should [news] be its own section and not the league?"). The game
  // agrees and says why: CM's rail entry for this screen is the MANAGER'S NAME
  // and its title bar reads `Mike Paul News` — the news belongs to the man, not
  // to the competition he plays in.
  // "Mail" since 23 Sep 2026 (Craig: "Use mail"); the route stays `/news`.
  { href: MAIL, label: "Mail", glyph: "mail", routes: [MAIL] },
  // **Scout is a section again** (Craig, 5 Sep 2026: *"I think this function
  // will be its own section away from the league etc"*), and DESIGN §1 has
  // listed Players among the Desk's own all along — it was `sections.ts` that
  // drifted when the bar ran out of room, not the design.
  //
  // **"Find", which is Championship Manager's own word for this slot.** Its
  // rail in `cm9900/12.jpg`, `11.jpg` and `25.jpg` reads `Continue Game ·
  // <manager> · Competitions · Nations & Clubs · Find · Game Options`, and Find
  // is the entry for looking a player up (Craig, 10 Sep 2026: *"replace with
  // something more CM"*). It read "Scout" until then, on a comment that cited
  // CM's Find as the reason — a stand-in for a word the reference already had.
  //
  // The URL stays `/players`, because a URL is persisted the moment somebody
  // shares it and the route did not change. `titles.ts` carries the same label
  // for the bar; the two must not drift.
  { href: POOL, label: "Find", routes: [POOL], overflow: true },
  { href: "/fpl", label: "FPL", routes: ["/fpl"], overflow: true },
];

/** The sections this round has, and which of them are on the bar.
 *
 *  Both answers turn on the same fact and are therefore one function: whether
 *  football is on decides that Live exists at all, and that My Team gives up its
 *  plate to it. `Rail` used to hold the first half inline — it is a client
 *  component, so the rule was untestable there, and it is the rule the bar's
 *  measured ceiling rests on. */
export function sectionsFor(matchday: boolean): Section[] {
  return SECTIONS.filter((section) => matchday || !section.onlyDuringGameweek).map((section) =>
    matchday && section.overflowDuringGameweek ? { ...section, overflow: true } : section,
  );
}

/** The tabs a phone's rail draws, in order, before `More` is added. */
export function barSections(sections: readonly Section[]): Section[] {
  return sections.filter((section) => !section.overflow);
}

/** What is behind `More`. Empty means the door is not drawn at all — a `More`
 *  that opens onto nothing is a control that does nothing. */
export function overflowSections(sections: readonly Section[]): Section[] {
  return sections.filter((section) => section.overflow);
}

/** The page behind the phone's last tab, and the credits it carries. */
export const MORE = "/more";
export const CREDITS = "/credits";

/** Whether the More tab is where you are: its page, the credits, the squad index, or a section behind it. */
export function moreOwns(sections: readonly Section[], pathname: string): boolean {
  return (
    pathname === SQUAD ||
    owns([MORE, CREDITS], pathname) ||
    overflowSections(sections).some((section) => owns(section.routes, pathname))
  );
}

export function owns(routes: readonly string[], pathname: string): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/** Whether a route is newsprint rather than desk. The rail asks it to stand
 *  down; anything else that needs to know which register it is under asks here
 *  rather than keeping its own list of paper routes. */
export function isPaperRoute(pathname: string): boolean {
  return owns(PAPER_ROUTES, pathname);
}

/** The routes whose SUBJECT owns the ground: a club, and a match, which takes
 *  the home club's.
 *
 *  A club screen is about somebody rather than about the competition, and
 *  `PlateShell` already says so in that club's colours; the photograph behind it
 *  is the same statement one layer further back. A match is played at the home
 *  club's ground, so it wears the same picture — which is the ONE thing the
 *  fixture is about that the two crests on the bar do not already say. */
const SUBJECT_GROUND_ROUTES = [CLUB, MATCH];

/** Whether the page under this route draws its own ground, so the shell's
 *  standing one should stand down rather than load a photograph nobody sees.
 *
 *  The shell cannot resolve the club itself — it renders above every route in
 *  the app and a match id says nothing about who is at home — so the two Shells
 *  that DO know draw it, and this is how the shell knows to get out of the way.
 *  Same shape and same reason as `isPaperRoute`. */
export function drawsOwnGround(pathname: string): boolean {
  return owns(SUBJECT_GROUND_ROUTES, pathname);
}
