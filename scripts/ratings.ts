import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  FANTRAX_LEAGUE_ID,
  clubResults,
  fetchFixtures,
  fetchLeagueInfo,
  fetchLive,
  getFootballSnapshot,
  londonDayOf,
  mapFixtures,
  mapLeagueInfo,
  mapLiveStats,
  isUnmapped,
  readRatingStore,
  requireLeague,
  type Bridge,
  type Fixture,
  type PlayerMatchStats,
  type RatingStore,
} from "@epl/core";
import { dayFigures, markOf, playedOn } from "./edition/matchdayRatings";
import { INTEL_SEASON } from "./intel";
import { MAPPINGS_ROOT, RATINGS_ROOT } from "./paths";

// Our mark for every man in every settled match day not yet rated, into `data/ratings/26-27.json`, which the player pages
// read. A day is settled when FPL has closed every match on it. Marks are one league's points: a file marked by another
// league is left alone unless `--restart` asks for it again. Six Fantrax reads a day rated, one FPL read per gameweek.

const FILE = join(RATINGS_ROOT, `${INTEL_SEASON}.json`);

/** The file as held, a fresh one, or null when it was marked by another league and nobody asked to restart. */
function held(): RatingStore | null {
  const store = readRatingStore(existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : undefined);
  if (store.manifest.leagueId === FANTRAX_LEAGUE_ID) return store;
  if (store.manifest.leagueId !== "" && !process.argv.includes("--restart")) return null;
  return { manifest: { season: INTEL_SEASON, leagueId: FANTRAX_LEAGUE_ID, updatedAt: "", days: [] }, marks: {} };
}

/** London days on which every match has finished and FPL has settled it, oldest first. */
function settledDays(fixtures: readonly Fixture[]): Map<string, Fixture[]> {
  const days = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const day = f.kickoff === null ? null : londonDayOf(f.kickoff);
    if (day !== null) days.set(day, [...(days.get(day) ?? []), f]);
  }
  return new Map([...days].filter(([, on]) => on.every((f) => f.status === "finished" && f.settled)).sort(([a], [b]) => a.localeCompare(b)));
}

async function main(): Promise<void> {
  requireLeague(FANTRAX_LEAGUE_ID);
  const store = held();
  if (store === null) return console.log(`ratings: the file is marked from another league than ${FANTRAX_LEAGUE_ID}; --restart to mark it again.`);
  const [fixtures, info] = await Promise.all([fetchFixtures().then(mapFixtures), fetchLeagueInfo(FANTRAX_LEAGUE_ID).then(mapLeagueInfo)]);
  const due = [...settledDays(fixtures)].filter(([day]) => !store.manifest.days.includes(day));
  if (due.length === 0) return console.log(`ratings: no day due; ${store.manifest.days.length} rated.`);
  if (info.scoring === null) throw new Error("the league described no scoring");

  const snapshot = await getFootballSnapshot();
  const gameweeks = [...new Set(fixtures.filter((f) => f.status === "finished" && f.gameweek !== null).map((f) => f.gameweek!))];
  const rounds = new Map<number, PlayerMatchStats[]>();
  for (const gw of gameweeks) rounds.set(gw, mapLiveStats(await fetchLive(gw)));
  const results = clubResults(fixtures, [...rounds.values()], new Map(snapshot.players.map((p) => [p.id, p.clubId])));
  const bridge = JSON.parse(readFileSync(join(MAPPINGS_ROOT, "fantrax.json"), "utf8")) as Bridge;
  const idOfCode = new Map(snapshot.players.map((p) => [p.code, p.id]));

  for (const [day, on] of due) {
    const figures = await dayFigures(FANTRAX_LEAGUE_ID, day);
    let rated = 0;
    for (const fantraxId of playedOn(figures)) {
      const entry = bridge[fantraxId];
      const code = entry === undefined || isUnmapped(entry) ? undefined : entry.fplCode;
      const playerId = code == null ? undefined : idOfCode.get(code);
      // His match that day from FPL's own row.
      const row = playerId === undefined ? undefined : [...rounds.values()].flat().find((r) => r.playerId === playerId && on.some((f) => f.id === r.fixtureId));
      const fixture = row === undefined ? undefined : on.find((f) => f.id === row.fixtureId);
      const club = snapshot.players.find((p) => p.code === code)?.clubId;
      // A man whose club now is neither side moved since; his opponent is unknown, so he is left unrated.
      if (code == null || fixture === undefined || fixture.kickoff === null || (club !== fixture.homeClubId && club !== fixture.awayClubId)) continue;
      const mark = markOf(figures, info.scoring, fantraxId, {
        minutes: figures.shorts.get(fantraxId)?.Min ?? 0,
        opponentClubId: club === fixture.homeClubId ? fixture.awayClubId : fixture.homeClubId,
        kickoff: fixture.kickoff,
        results,
      });
      (store.marks[String(code)] ??= {})[String(fixture.code)] = mark;
      rated++;
    }
    store.manifest.days.push(day);
    console.log(`ratings: ${day}, ${rated} men rated across ${on.length} matches.`);
  }
  store.manifest.updatedAt = new Date().toISOString();
  mkdirSync(RATINGS_ROOT, { recursive: true });
  writeFileSync(FILE, `${JSON.stringify(store)}\n`);
}

main().catch((error: unknown) => {
  console.error(`ratings: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
