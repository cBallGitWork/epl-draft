import { notFound } from "next/navigation";
import type {
  Club,
  FootballPlayer,
  Fixture,
  FootballSnapshot,
  IntelMatch,
  MatchSheet,
  PlayerMatchStats,
  PlayerOwner,
} from "@epl/core";
import { clubById } from "@epl/core";
import { footballNow, gameweekLive, gameweekSheets, seasonFixtures, speaksForNow } from "../../../football";
import { intelMatches } from "../../../intel";
import { marks } from "../../../involvement";

// The one read every match tab makes, so none assembles it twice and they cannot disagree about a field.

export interface Match {
  fixture: Fixture;
  home: Club | undefined;
  away: Club | undefined;
  snapshot: FootballSnapshot;
  /** The WHOLE season, not `snapshot.fixtures` (one round) — a form guide off one round ranks on ten matches. */
  season: readonly Fixture[];
  /** This match's sheet, or null before its round's first kickoff. */
  sheet: MatchSheet | null;
  /** Minutes and FPL's per-fixture points, by FPL's per-season id. `figures`, because `live` means in play. */
  figures: Map<number, PlayerMatchStats>;
  /** Every footballer by FPL's season-stable `code` — the Premier League's feeds speak it, the app speaks `id`. */
  byCode: Map<number, FootballPlayer>;
  /** What the sister repo logged about this match; undefined for the matches it has not reached. */
  logged: IntelMatch | undefined;
  /** In play AND our copy recent enough to say so — `status` has no clock, so a cached one keeps ticking. */
  live: boolean;
  /** A result rather than a running total; not `homeScore !== null`, which FPL writes from the first goal. */
  finished: boolean;
}

/** Everything about one fixture, or a 404. The score comes from `seasonFixtures` and the sheet from
 *  `gameweekSheets`, never crossed, so two caches going stale apart cannot put a score beside the wrong scorers. */
export async function readMatch(id: string): Promise<Match> {
  const wanted = Number(id);
  if (!Number.isInteger(wanted)) notFound();

  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const fixture = fixtures.find((entry) => entry.id === wanted);
  if (fixture === undefined) notFound();

  // A fixture with no round still renders, without either per-round read, because somebody followed a link to it.
  const [sheets, figures] = await Promise.all([
    fixture.gameweek === null ? [] : gameweekSheets(fixture.gameweek),
    fixture.gameweek === null ? [] : gameweekLive(fixture.gameweek),
  ]);
  const clubs = clubById(snapshot);

  return {
    fixture,
    home: clubs.get(fixture.homeClubId),
    away: clubs.get(fixture.awayClubId),
    snapshot,
    season: fixtures,
    sheet: sheets.find((s) => s.fixtureId === fixture.id) ?? null,
    figures: new Map(
      figures.filter((row) => row.fixtureId === fixture.id).map((row) => [row.playerId, row]),
    ),
    byCode: new Map(snapshot.players.map((player) => [player.code, player])),
    logged: intelMatches.get(fixture.id),
    live: fixture.status === "live" && speaksForNow(snapshot),
    finished: fixture.status === "finished",
  };
}

/** Who in our league holds each man in this match — a Fantrax call, so its own read a page can stream, and
 *  empty rather than an error when Fantrax will not say. */
export async function matchOwners(fixture: Fixture): Promise<Map<number, PlayerOwner>> {
  const { owners } = await marks([fixture]);
  return owners ?? new Map();
}

/** A named man's name: FPL's short form where the bridge reaches him (`Gakpo`, not `Cody Mathès Gakpo`),
 *  the team sheet's where it does not. */
export function sheetName(
  man: { code: number | null; name: string },
  byCode: Map<number, FootballPlayer>,
): string {
  return (man.code === null ? undefined : byCode.get(man.code)?.name) ?? man.name;
}
