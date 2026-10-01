import { DRAFT_DESK, debuts, fullPrintName, ukSpelling, londonDayOf, priceOf, type Club, type DraftMan, type Fixture, type ProjectedPlayer, type Sheet, type SheetMan, type SlotWorth } from "@epl/core";
import { startedOf, timeOf, type ClubGoal, type Tally } from "./draftReads";

// One man as the draft desk sees him at a cut-off: his points, minutes and returns from Fantrax's day reads, his matches
// played and to come from FPL's fixtures, whether he started from the PL team sheet, and his goals' minutes.

export interface ManReads {
  gameweek: number;
  /** The cut-off's London day. */
  last: string;
  fixtures: readonly Fixture[];
  clubs: ReadonlyMap<number, Club>;
  byMan: ReadonlyMap<string, Tally>;
  /** Each London day's tallies to the cut-off, in order. */
  days: readonly { day: string; byMan: ReadonlyMap<string, Tally> }[];
  worth: SlotWorth;
  goals: ReadonlyMap<number, ClubGoal[]>;
  starters: ReadonlyMap<number, ReadonlySet<number>>;
  history: ReadonlyMap<string, Sheet[]>;
  projections: ReadonlyMap<number, ProjectedPlayer>;
  arrivals: ReadonlyMap<string, { teamId: string; how: "claim" | "trade" }>;
}

export function draftManOf(m: SheetMan, sheet: Sheet, r: ManReads): DraftMan {
  const club = m.player.clubId;
  const games = r.fixtures.filter((f) => f.homeClubId === club || f.awayClubId === club);
  const done = games.filter((f) => londonDayOf(f.kickoff!)! <= r.last);
  const coming = games.find((f) => !done.includes(f));
  const home = coming?.homeClubId === club;
  const opponent = coming === undefined ? undefined : r.clubs.get(home ? coming.awayClubId : coming.homeClubId);
  const got = r.byMan.get(m.fantraxId);
  // A clean sheet counts where it is worth telling; a midfielder's single point is not.
  const paidClean = priceOf(r.worth, m.slot, "clean sheet") >= DRAFT_DESK.cleanSheetStory;
  const appeared = (got?.minutes ?? 0) > 0;
  const theirGoals = done.flatMap((f) => r.goals.get(f.code) ?? []);
  const arrival = r.arrivals.get(m.fantraxId);
  return {
    fantraxId: m.fantraxId,
    code: m.player.code,
    clubCode: r.clubs.get(club)?.code ?? 0,
    clubId: club,
    name: ukSpelling(m.player.name),
    fullName: ukSpelling(fullPrintName(m.player)),
    club: r.clubs.get(club)?.name ?? "?",
    slot: m.slot,
    points: got?.points ?? null,
    minutes: got?.minutes ?? 0,
    played: done.length,
    left: games.length - done.length,
    debut: (debuts(sheet, r.history.get(sheet.teamId) ?? []) ?? []).some((d) => d.fantraxId === m.fantraxId),
    arrived: arrival?.teamId === sheet.teamId ? arrival.how : null,
    projected: r.projections.get(m.player.code)?.gameweeks.find((g) => g.gw === r.gameweek)?.points ?? null,
    next: opponent === undefined || coming === undefined ? null : { opponent: opponent.name, home, kickoff: coming.kickoff! },
    started: appeared ? startedOf(m.player.code, done.map((f) => f.code), r.starters) : null,
    matches: games.map((f) => ({ code: f.code, label: `${r.clubs.get(f.homeClubId)?.name ?? "?"} v ${r.clubs.get(f.awayClubId)?.name ?? "?"}` })),
    // Read after the men are built, for the few who need it (draftFitness.ts).
    fitness: null,
    goals: got?.goals ?? 0,
    assists: got?.assists ?? 0,
    cleanSheets: paidClean ? (got?.cleanSheets ?? 0) : 0,
    scoredAt: theirGoals.filter((g) => !g.own && g.scorer === m.player.code).map(timeOf),
    // The first goal his club let in, in each match he played: the one that took a clean sheet.
    concededFirstAt: appeared && paidClean ? done.flatMap((f) => (r.goals.get(f.code) ?? []).filter((g) => g.clubId !== club).slice(0, 1).map(timeOf)) : [],
    byDay: r.days.flatMap(({ day, byMan }) => {
      const t = byMan.get(m.fantraxId);
      return t === undefined || (t.minutes === 0 && t.points === 0) ? [] : [{ day, points: t.points, minutes: t.minutes, goals: t.goals, assists: t.assists, cleanSheets: paidClean ? t.cleanSheets : 0 }];
    }),
  };
}
