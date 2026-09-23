import { notFound } from "next/navigation";
import type { Club, FootballSnapshot, Fixture, TableRow } from "@epl/core";
import { isResolved, isUnmapped, leagueTable } from "@epl/core";
import { footballNow, seasonFixtures } from "../../../football";
import { leagueInfo } from "../../../round";
import { getLeagueSquads } from "../../../squads";
import { bridge } from "../../../squads";

// What every club tab reads, in one place.
//
// `squad/[teamId]/team.ts` is the fantasy twin and this is deliberately its
// shape: the four tabs under a club all need the same two football reads, and a
// page that repeated the `Number.isInteger` guard and the `find` four times is
// four places for a 404 to stop working.

/** One club by its FPL code, with the season's football around it.
 *
 *  Keyed on the season-stable `code` and never `clubId`: a URL is persisted the
 *  moment somebody shares it, and FPL's per-season ids are recycled
 *  (CODE_RULES §3).
 *
 *  Both reads, because every tab needs both — the snapshot for the club and its
 *  players, the fixtures for anything that has happened or is going to. They
 *  are the app's two cached football reads, so a club page costs no request the
 *  section was not already making. */
export async function clubOr404(
  code: string,
): Promise<{ club: Club; snapshot: FootballSnapshot; fixtures: Fixture[] }> {
  const wanted = Number(code);
  // Reject anything that is not a plain club code before asking FPL for it —
  // "3.5" and "3abc" both coerce to something `Number` will happily accept.
  if (!Number.isInteger(wanted)) notFound();

  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const club = snapshot.clubs.find((entry) => entry.code === wanted);
  if (club === undefined) notFound();

  // **The whole snapshot, not a selection out of it.** This returned `clubs` and
  // the club's own `players`, which meant every tab that also wanted `clubById`
  // or the full player list called `footballNow()` a SECOND time — three of the
  // four did. Cached, so it cost no request, but two reads of one thing in one
  // render is two places for them to disagree, and it read as though the tab
  // were fetching something this did not have.
  return { club, snapshot, fixtures };
}

/** Where the club stands, or null when the competition has not placed it.
 *
 *  `leagueTable` returns the rows already in order and carries no rank of its
 *  own, because the list IS the ranking (`football/table.ts`) — so the place is
 *  the index, counted here rather than in each of four tabs. */
export function standing(
  fixtures: readonly Fixture[],
  clubs: readonly Club[],
  club: Club,
): { row: TableRow; place: number } | null {
  const table = leagueTable(fixtures, clubs);
  const at = table.findIndex((row) => row.clubId === club.id);
  const row = at === -1 ? undefined : table[at];
  return row === undefined ? null : { row, place: at + 1 };
}

/** What OUR league says about each of these men, by FPL code.
 *
 *  **This is the one place the two layers meet on a Premiership screen, and it
 *  is a join, not a merge.** Fantrax's letters are a rule of our competition —
 *  the commissioner's vocabulary, not a fact about the footballer — so they are
 *  read through the bridge and handed over labelled as Fantrax's, beside the
 *  real-life position rather than instead of it. A single column carrying both
 *  would say Arsenal play Saka at midfield, when what is true is that this
 *  league files him there; and which of `F,M` actually scores is the roster slot
 *  his manager picked, a fact about a team and not about a man (CLAUDE.md,
 *  "Fantrax scores the roster slot").
 *
 *  **Empty when Fantrax will not answer, never an error.** `leagueInfo` is
 *  already failure-tolerant for `round.ts`'s reason, and a club page is
 *  football: losing a column our league contributed must not lose the squad.
 *
 *  The bridge is stored the other way round — Fantrax's id to FPL's code — so it
 *  is inverted here. Built once by `npm run bridge` and audited; never
 *  name-matched at runtime. */
export interface LeagueOpinion {
  /** Fantrax's own id for him — what the player card's "Full profile" links to. */
  fantraxId: string;
  /** What this league deems him eligible to play as. */
  positions: string[];
  /** Fantrax's own code, raw: "T" taken, "WW" waivers, "FA" free agent. Their
   *  vocabulary, so it is carried rather than translated — an undrafted league
   *  marks everybody "WW" and a drafted one splits all three, and anything
   *  keying off a letter would be reading a league state as a player fact. */
  status: string;
  /** The team holding him, or null when nobody does. A NAME rather than an id
   *  because the only thing a Premiership screen does with it is print it. */
  owner: string | null;
}

export async function leagueOpinions(): Promise<Map<number, LeagueOpinion>> {
  const [info, squads] = await Promise.all([leagueInfo(), getLeagueSquads()]);
  if (info === null) return new Map();

  // `isUnmapped` rather than a truthiness check: a bridge row is a union, and an
  // unmapped one is a settled ANSWER — 120 of the pool are academy names FPL has
  // never listed — not a missing value to skip past quietly.
  const fplCodeOf = new Map<string, number>();
  for (const [fantraxId, entry] of Object.entries(bridge)) {
    if (!isUnmapped(entry)) fplCodeOf.set(fantraxId, entry.fplCode);
  }

  // Who holds whom, keyed on FPL's code — read off the RESOLVED slot rather
  // than through the bridge a second time. `join/roster` has already done that
  // join and carries the footballer, so an owner is `player.code` and needs no
  // second lookup. An unresolved slot is a man FPL has never listed, and he is
  // not on a Premier League club's squad list either.
  //
  // An undrafted or unreadable league answers nobody, which is a true statement
  // about it rather than a reason to drop the other columns.
  const owners = new Map<number, string>();
  if (!("undrafted" in squads) && !("unavailable" in squads)) {
    for (const team of squads.period.teams) {
      for (const held of team.players) {
        if (isResolved(held)) owners.set(held.player.code, team.teamName);
      }
    }
  }

  const opinions = new Map<number, LeagueOpinion>();
  for (const player of info.players) {
    const code = fplCodeOf.get(player.fantraxId);
    if (code === undefined) continue;
    opinions.set(code, {
      fantraxId: player.fantraxId,
      positions: player.eligiblePositions,
      status: player.status,
      owner: owners.get(code) ?? null,
    });
  }
  return opinions;
}
