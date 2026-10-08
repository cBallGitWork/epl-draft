import {
  ASSIST,
  KEEPER_WORK,
  firstScored,
  idsOf,
  fetchPlFixture,
  fetchPlRound,
  mapBenchPlayerPoints,
  mapLivePlayerPoints,
  plFixtureCode,
  plGoals,
  plTeamSheets,
  pointsFor,
  type DatedFixture,
  type GoalTime,
  type LeagueInfo,
  type LeagueScoring,
  type LivePlayerPoints,
  type PlGoal,
  type RosteredTeam,
  type SlotWorth,
  sheetOf,
} from "@epl/core";

// The draft desk's readings of one gameweek's payloads: each goal's minute and club from the PL feed, each man's points
// and counts from Fantrax's day reads, and what a slot is paid from the scoring league's rules.

type Raw = Parameters<typeof mapLivePlayerPoints>[0];

export interface Tally {
  points: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
}

export type ClubGoal = PlGoal & { clubId: number; kickoff: string };

/** Each goal of the gameweek with its minute and the FPL club it counts for, and each match's starters, both by FPL
 *  fixture code, off the same team sheets. A match with no sheet has no starters entry. */
export async function matchReads(gameweek: number, fixtures: readonly DatedFixture[], players: readonly { code: number; optaCode: string | null }[]): Promise<{ goals: Map<number, ClubGoal[]>; starters: Map<number, Set<number>> }> {
  const out = new Map<number, ClubGoal[]>();
  const starters = new Map<number, Set<number>>();
  const page = await fetchPlRound(gameweek).catch(() => null);
  if (page === null) return { goals: out, starters };
  const optaToCode = new Map(players.flatMap((p) => (p.optaCode === null ? [] : [[p.optaCode, p.code] as const])));
  for (const summary of page.content) {
    const code = plFixtureCode(summary);
    const ours = fixtures.find((f) => f.code === code);
    if (ours === undefined || summary.status === "U") continue;
    const detail = await fetchPlFixture(summary.id).catch(() => null);
    if (detail === null) continue;
    // The detail lists the home side first; a goal counts for the side whose team id it carries, an own goal included.
    const homeTeam = detail.teams[0]?.team.id;
    out.set(ours.code, plGoals(detail, optaToCode).map((g) => ({ ...g, clubId: String(g.teamId) === String(homeTeam) ? ours.homeClubId : ours.awayClubId, kickoff: ours.kickoff })));
    const sheets = plTeamSheets(detail, optaToCode);
    if (sheets !== null) starters.set(ours.code, new Set([...sheets.home.lineup, ...sheets.away.lineup].flatMap((man) => (man.code === null ? [] : [man.code]))));
  }
  return { goals: out, starters };
}

/** Whether a man started, from the sheets of the matches he played; null when one of them has no sheet, so a sheet
 *  that failed to load never benches a man. */
export function startedOf(code: number, played: readonly number[], starters: ReadonlyMap<number, ReadonlySet<number>>): boolean | null {
  if (played.length === 0 || played.some((fixture) => !starters.has(fixture))) return null;
  return played.some((fixture) => starters.get(fixture)!.has(code));
}

export const timeOf = (g: ClubGoal): GoalTime => (g.added === undefined ? { minute: g.minute, kickoff: g.kickoff } : { minute: g.minute, added: g.added, kickoff: g.kickoff });

/** Fantrax's category ids for minutes, goals, assists and clean sheets, and what pays a keeper's work or a defence. */
export function categoryIds(info: LeagueInfo): Record<"minutes" | "goals" | "assists" | "cleanSheets" | "keeping" | "defence", ReadonlySet<string>> {
  const by = (match: (code: string, name: string) => boolean) => new Set(Object.entries(info.scoringCategories).filter(([, c]) => match(c.code, c.name)).map(([id]) => id));
  const code = (wanted: string) => by((c) => c === wanted);
  const assist = firstScored(info.scoringCategories, ASSIST);
  return {
    minutes: code("Min"),
    goals: code("G"),
    assists: assist === null ? new Set() : idsOf(info.scoringCategories, [assist]),
    cleanSheets: code("CS"),
    keeping: idsOf(info.scoringCategories, KEEPER_WORK),
    defence: by((_, name) => /^Defensive Points/u.test(name)),
  };
}

/** Each man's points and counts over the days read, eleven and bench alike. */
export function tallies(raws: readonly Raw[], ids: ReturnType<typeof categoryIds>): Map<string, Tally> {
  const out = new Map<string, Tally>();
  for (const p of raws.flatMap((raw) => [...mapLivePlayerPoints(raw), ...mapBenchPlayerPoints(raw)]).flatMap((squad) => squad.players)) {
    const was = out.get(p.fantraxId) ?? { points: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0 };
    out.set(p.fantraxId, {
      points: was.points + p.points,
      minutes: was.minutes + countOf(p, ids.minutes),
      goals: was.goals + countOf(p, ids.goals),
      assists: was.assists + countOf(p, ids.assists),
      cleanSheets: was.cleanSheets + countOf(p, ids.cleanSheets),
    });
  }
  return out;
}

/** A full match's minutes, football's rule. */
const FULL_MATCH = 90;

/** The most Fantrax paid in some categories to one man at a slot in a match this gameweek; 0 when it paid nothing. */
export function mostPaid(raws: readonly Raw[], categories: ReadonlySet<string>, slot: string, slotOf: ReadonlyMap<string, string>): number {
  const paid = raws
    .flatMap((raw) => mapLivePlayerPoints(raw))
    .flatMap((squad) => squad.players)
    .filter((p) => slotOf.get(p.fantraxId) === slot)
    .map((p) => p.categories.filter((c) => categories.has(c.category)).reduce((sum, c) => sum + c.points, 0));
  return Math.max(0, ...paid);
}

/** His count in one of Fantrax's categories, as it states it; nought when it states none. */
function countOf(p: LivePlayerPoints, categories: ReadonlySet<string>): number {
  const row = p.counts.find((c) => categories.has(c.category));
  return row === undefined || row.value === null ? 0 : Number(row.value) || 0;
}

/** What each slot is paid for a return and a full match's minutes, by the scoring league's rules; the most a defensive
 *  bonus or a keeper's work paid in a match, from the gameweek's own payments (`ids`). A keeper's return is a clean sheet. */
export function slotWorth(
  scoring: LeagueScoring | null,
  ids: ReturnType<typeof categoryIds>,
  raws: readonly Raw[],
  teams: readonly RosteredTeam[],
  slots: readonly string[],
): SlotWorth {
  const rules = scoring?.rules ?? null;
  const priced = (category: string, slot: string, count = 1) => (rules === null ? 0 : (pointsFor(rules, category, slot, count) ?? 0));
  const assist = scoring === null ? null : firstScored(scoring.categories, ASSIST);
  const keeper = rules?.goaliePosition ?? null;
  const slotOf = new Map(teams.flatMap((t) => { const s = sheetOf(t); return [...s.starters, ...s.bench].map((m) => [m.fantraxId, m.slot] as const); }));
  return {
    keeper,
    appearance: Math.max(0, ...slots.map((slot) => priced("Min", slot, FULL_MATCH))),
    bonus: Object.fromEntries(slots.map((slot) => [slot, mostPaid(raws, slot === keeper ? ids.keeping : ids.defence, slot, slotOf)])),
    returns: Object.fromEntries(
      slots.map((slot) => [
        slot,
        (slot === keeper
          ? [{ kind: "clean sheet" as const, worth: priced("CS", slot) }]
          : [{ kind: "goal" as const, worth: priced("G", slot) }, { kind: "assist" as const, worth: assist === null ? 0 : priced(assist.short, slot) }, { kind: "clean sheet" as const, worth: priced("CS", slot) }]
        ).filter((w) => w.worth > 0),
      ]),
    ),
  };
}
