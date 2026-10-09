// The app's sections as one table, read by both rails and the More page.
// No JSX and no `"use client"`: client and server modules both import it, and so must its imports.

import { LEAGUE, MATCHUPS } from "../../league/routes";
import { POOL } from "../../players/routes";
import { CLUB, MATCH, PREM, PREM_RESULTS } from "../../prem/routes";
import { MY_TEAM, SQUAD } from "../../squad/routes";
import type { GlyphName } from "./glyphs";

/** The paper's territory: the front page and each story's own page. */
const PAPER_ROUTES = ["/", "/paper"];

/** A section owns every route under it, so a detail page still lights its tab. Squads is not one: a
 *  rival's squad is reached through the league, and only your own (My Team) has a tab. */
export interface Section {
  href: string;
  label: string;
  routes: string[];
  /** Only while football is on, from an hour before the first kickoff. The Live section and nothing else. */
  onlyDuringGameweek?: boolean;
  /** The glyph over its word on the phone's rail; a section that is always behind More has none. */
  glyph?: GlyphName;
  /** Its full name where a row has room for it, as More's page does. */
  fullLabel?: string;
  /** Behind `More` on a phone, flat on the desk rail: six tabs at 320 leave a label 49px (DESIGN §2). */
  overflow?: boolean;
  /** Behind `More` only while football is on, because Live takes its slot. */
  overflowDuringGameweek?: boolean;
  /** Folded with its fellow members into one phone tab that pops a square for each. */
  group?: GroupKey;
  /** Too big a page to fetch ahead on every poll, so it is fetched once (`aheadOf`): Data's board is ~90KB, the rest ~50KB. */
  heavy?: boolean;
}

export type GroupKey = "comps";

/** A phone tab that stands for several sections. */
const GROUPS: Record<GroupKey, { label: string; fullLabel: string; glyph: GlyphName }> = {
  comps: { label: "Comps", fullLabel: "Competitions", glyph: "comps" },
};

/** The manager's inbox, labelled Mail. */
export const MAIL = "/news";

/** The Live section, there from an hour before a gameweek's first kickoff to its last whistle. */
export const LIVE = "/matchday";

/** A gameweek's own page, `/gw/[n]`: Live's, though it outlasts the gameweek. */
export const GAMEWEEK = "/gw";

/** One gameweek's page. */
export function gameweekHref(gameweek: number): string {
  return `${GAMEWEEK}/${gameweek}`;
}

/** The FPL tab. */
export const FPL = "/fpl";

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
  { href: LIVE, label: "Live", glyph: "live", routes: [LIVE, GAMEWEEK], onlyDuringGameweek: true },
  // "Draft" on the bar; the URL stays `/league`.
  { href: LEAGUE, label: "Draft", glyph: "league", routes: [LEAGUE], group: "comps" },
  // Opens on the results, and stays lit across the section, the table included.
  { href: PREM_RESULTS, label: "Prem", glyph: "prem", routes: [PREM], group: "comps" },
  // "Data" on the bar; the URL stays `/players`, because a shared URL outlives a label.
  { href: POOL, label: "Data", glyph: "data", routes: [POOL], heavy: true },
  // "Mail" on the bar; the route stays `/news`.
  { href: MAIL, label: "Mail", glyph: "mail", routes: [MAIL] },
  { href: FPL, label: "FPL", routes: [FPL], overflow: true },
];

/** The sections this gameweek has: Live only while football is on, when My Team gives it its tab. */
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

/** The pages `AutoRefresh` fetches ahead so a tap on a tab draws at once: the bar's and More's on each tick, a heavy
 *  one only when the app opens. */
export function aheadOf(sections: readonly Section[]): { each: string[]; once: string[] } {
  const bar = barSections(sections);
  return {
    each: [...bar.filter((section) => !section.heavy).map((section) => section.href), MORE],
    once: bar.filter((section) => section.heavy).map((section) => section.href),
  };
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

/** Whether a route is newsprint rather than desk; ask here rather than keeping a list of paper routes. */
export function isPaperRoute(pathname: string): boolean {
  return owns(PAPER_ROUTES, pathname);
}

/** The routes whose subject owns the ground: a club, and a match, which takes the home club's. */
const SUBJECT_GROUND_ROUTES = [CLUB, MATCH];

/** Whether the page under this route draws its own ground, so the shell's standing one stands down: a club,
 *  a match, a head-to-head over its home team's venue and a team's screens over its own (not the lists of them). */
export function drawsOwnGround(pathname: string): boolean {
  return owns(SUBJECT_GROUND_ROUTES, pathname) || pathname.startsWith(`${MATCHUPS}/`) || pathname.startsWith(`${SQUAD}/`);
}
