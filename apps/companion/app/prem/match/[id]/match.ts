import { notFound } from "next/navigation";
import type { FootballPlayer,
  Club,
  Fixture,
  FootballSnapshot,
  IntelMatch,
  MatchSheet,
  PlayerMatchStats,
  PlayerOwner,
} from "@epl/core";
import { clubById } from "@epl/core";
import {
  footballNow,
  gameweekLive,
  gameweekSheets,
  seasonFixtures,
  speaksForNow,
} from "../../../football";
import { intelMatches } from "../../../intel";
import { marks } from "../../../involvement";

// The one read both match views make, so neither of them assembles it twice.
//
// `prem/club/[code]/club.ts` is the shape and the reason: two tabs asking the
// same three questions is two places for them to be answered differently, and
// the assembly is where the rules about WHICH read owns which field live.

export interface Match {
  fixture: Fixture;
  home: Club | undefined;
  away: Club | undefined;
  snapshot: FootballSnapshot;
  /** The WHOLE season, not `snapshot.fixtures`, which is one round. A table or a
   *  form guide built off a snapshot would rank twenty clubs on the ten matches
   *  in view — `/prem`'s own table reads `seasonFixtures` for exactly this
   *  reason, and the two must never disagree about what has been played. */
  season: readonly Fixture[];
  /** This match's sheet, or null for a round FPL has not filed one for — which
   *  is every round before its first kickoff. */
  sheet: MatchSheet | null;
  /** Minutes and FPL's own per-fixture points, by FPL's per-season player id —
   *  every player in the match, every match of the season.
   *
   *  `figures` and not `live`, which this interface already spends on whether
   *  the match is being played. Both come from the same endpoint and mean
   *  entirely different things, and one name for the two read as a bridge. */
  figures: Map<number, PlayerMatchStats>;
  /** Every footballer in the league, by FPL's season-stable `code`.
   *
   *  **Here rather than in each component that wants it.** Counted before
   *  extracting: three screens built this exact map and a fourth built a `code →
   *  clubId` slice of it. They all want the same thing and for the same reason —
   *  the Premier League's own feeds speak `code`, and everything else in the app
   *  speaks FPL's per-season `id`, so a team sheet or a shot map has to cross
   *  back. Built once per page here instead of three times per render.
   *
   *  `snapshot.players` is the same array; this is the index onto it. */
  byCode: Map<number, FootballPlayer>;
  /** What the sister repo logged about this match — goal minutes, the positions
   *  men actually played, when they came on and off, SofaScore's rating, and
   *  both sides' figures. Undefined for the 360 of 380 it has not reached. */
  logged: IntelMatch | undefined;
  /** In play AND our copy recent enough to say so. `status` carries no clock, so
   *  a cached snapshot keeps a whistled match ticking for as long as the cache
   *  holds it — `MatchList` and `/gw/[gameweek]` both learned this the hard way. */
  live: boolean;
  /** Whether the score on screen is a result or a running total. NOT
   *  `homeScore !== null`: FPL writes a running score from the first goal, so
   *  that test prints `2-1` over a match still being played, with no tense.
   *  `Run.tsx` guards the same thing for the same reason. */
  finished: boolean;
}

/** Everything about one fixture, or a 404.
 *
 *  The score, the status and `settled` come from `seasonFixtures` and the sheet
 *  from `gameweekSheets`, and never the other way round: two independently
 *  cached reads of one URL can go stale apart, and a page that took the score
 *  from one and the scorers from the other would be a page arguing with itself.
 */
export async function readMatch(id: string): Promise<Match> {
  const wanted = Number(id);
  if (!Number.isInteger(wanted)) notFound();

  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const fixture = fixtures.find((entry) => entry.id === wanted);
  if (fixture === undefined) notFound();

  // Both per-round reads at once. A fixture FPL has not filed under a round has
  // no round to read either from — `prem/(competition)` leaves those out of its
  // lists entirely, and here the match still renders without them because
  // somebody has followed a link to it.
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

/** Who in our league holds each man in this match, or nothing at all.
 *
 *  **The second `/prem` route to cost a Fantrax request**, after the club page's
 *  Elig column — `docs/ui/prem.md` tracks that promise and this breaks it again,
 *  deliberately. What it buys is the line PRODUCT.md asks for: a goal in the
 *  Premier League is also somebody's afternoon.
 *
 *  Failure-tolerant by construction. `marks` returns an empty object on every
 *  ordinary way this can come back with nothing — signed out, no league,
 *  undrafted, Fantrax silent — and the football renders regardless.
 *
 *  Its own function rather than part of `readMatch` so a page can stream it:
 *  the football is three cached reads and this is a live provider call. */
export async function matchOwners(fixture: Fixture): Promise<Map<number, PlayerOwner>> {
  const { owners } = await marks([fixture]);
  return owners ?? new Map();
}

/** What to call a man the Premier League named, given the league's own players.
 *
 *  **FPL's short name where the bridge reaches him, the team sheet's where it
 *  does not.** The two providers disagree about spelling: the Premier League
 *  writes `Cody Mathès Gakpo` and `Michele Di Gregorio` where FPL writes `Gakpo`
 *  and `Di Gregorio`, and one column carrying both wraps to two lines beside
 *  rows that do not. A man the bridge cannot place keeps the long form, which is
 *  still his name.
 *
 *  Counted before extracting: **3** — the team sheet, the formation's discs and
 *  the report's summary all made the same fallback inline. */
export function sheetName(
  man: { code: number | null; name: string },
  byCode: Map<number, FootballPlayer>,
): string {
  return (man.code === null ? undefined : byCode.get(man.code)?.name) ?? man.name;
}
