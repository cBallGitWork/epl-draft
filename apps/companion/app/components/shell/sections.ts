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

/** The paper's territory: the front page, and each story's own page behind it. Tables and charts
 *  belong on the front page; what lives behind it is an article. */
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
  /** Folded with its fellow members into one phone tab that pops a square for each (Craig, 24 Sep 2026). */
  group?: GroupKey;
}

export type GroupKey = "comps";

/** A phone tab that stands for several sections: CM's Competitions (`cm9900/12.jpg`). */
export const GROUPS: Record<GroupKey, { label: string; fullLabel: string; glyph: GlyphName }> = {
  comps: { label: "Comps", fullLabel: "Competitions", glyph: "comps" },
};

/** The manager's inbox, labelled Mail. */
export const MAIL = "/news";

export const SECTIONS: Section[] = [
  { href: "/", label: "Gazetta", glyph: "gazetta", routes: PAPER_ROUTES },
  // One route, not a prefix, so it lights on the reader's own five tabs and stays dark on a rival's.
  // `Team` because `My Team` renders at 51px against a tab's 49px at 320; `fullLabel` says it where rows have room.
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
  // "Draft", not League (Craig, 24 Sep 2026: "Prem is real life, draft is draft"); the URL stays `/league`.
  { href: "/league", label: "Draft", glyph: "league", routes: ["/league"], group: "comps" },
  // "Prem" on the rail; the title bar says "FA Barclays Premiership" (`cm9900/24.jpg`). Beside Draft, the real one.
  { href: "/prem", label: "Prem", glyph: "prem", routes: ["/prem"], group: "comps" },
  // The fantasy deep dive, on the bar since 24 Sep 2026 (Craig: "data needs to be at the bottom"). It was CM's
  // "Find"; the URL stays `/players`, because a shared URL outlives a label. `titles.ts` carries the same word.
  { href: POOL, label: "Data", glyph: "data", routes: [POOL] },
  // **The manager's inbox, and it is a section rather than a tab** (Craig, 5 Sep
  // 2026: "Should [news] be its own section and not the league?"). The game
  // agrees and says why: CM's rail entry for this screen is the MANAGER'S NAME
  // and its title bar reads `Mike Paul News` — the news belongs to the man, not
  // to the competition he plays in.
  // "Mail" since 23 Sep 2026 (Craig: "Use mail"); the route stays `/news`.
  { href: MAIL, label: "Mail", glyph: "mail", routes: [MAIL] },
  { href: "/fpl", label: "FPL", routes: ["/fpl"], overflow: true },
];

/** The sections this round has: Live only while football is on, when My Team gives it its tab. Pure, so tested. */
export function sectionsFor(matchday: boolean): Section[] {
  return SECTIONS.filter((section) => matchday || !section.onlyDuringGameweek).map((section) =>
    matchday && section.overflowDuringGameweek ? { ...section, overflow: true } : section,
  );
}

/** The tabs a phone's rail draws, in order, before `More` is added. */
export function barSections(sections: readonly Section[]): Section[] {
  return sections.filter((section) => !section.overflow);
}

export type BarTab =
  | { kind: "section"; section: Section }
  | ({ kind: "group"; key: GroupKey; members: Section[] } & (typeof GROUPS)[GroupKey]);

/** The phone's tabs before `More`: a group's consecutive members fold into one tab at the first one's place. */
export function barTabs(sections: readonly Section[]): BarTab[] {
  const tabs: BarTab[] = [];
  for (const section of barSections(sections)) {
    const last = tabs.at(-1);
    if (section.group && last?.kind === "group" && last.key === section.group) last.members.push(section);
    else if (section.group) tabs.push({ kind: "group", key: section.group, ...GROUPS[section.group], members: [section] });
    else tabs.push({ kind: "section", section });
  }
  return tabs;
}

/** Whether a tab is where you are: a group is when any of its members is. */
export function tabOwns(tab: BarTab, pathname: string): boolean {
  const members = tab.kind === "group" ? tab.members : [tab.section];
  return members.some((section) => owns(section.routes, pathname));
}

/** What is behind `More`, listed on its page before the squads and the credits. */
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
