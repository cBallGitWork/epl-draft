import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  clubResults,
  fetchFixtures,
  fetchLive,
  getFootballSnapshot,
  londonDay,
  londonDayOf,
  mapFixtures,
  mapLiveStats,
  isUnmapped,
  readRatingStore,
  type Fixture,
  type PlayerMatchStats,
  type RatingStore,
} from "@epl/core";
import { dayFigures, markOf, playedOn } from "./edition/matchdayRatings";
import { dayDone, menOwed } from "./ratings/day";
import { SCORING_LEAGUE } from "./leagues";
import { INTEL_SEASON, readBridge } from "./intel";
import { RATINGS_ROOT } from "./paths";
import { readScoring } from "./scoring";

// Our mark for every man in every settled match day not yet rated, into `data/ratings/26-27.json`, which the player pages
// read. A day is settled when FPL has closed every match on it. Marks are the scoring league's points, whichever is served;
// a file marked by another league is left alone unless `--restart` asks again. Six Fantrax reads a day, one FPL per gameweek.

const FILE = join(RATINGS_ROOT, `${INTEL_SEASON}.json`);

/** The file as held, a fresh one, or null when it was marked by another league and nobody asked to restart. */
function held(): RatingStore | null {
  const store = readRatingStore(existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : undefined);
  if (store.manifest.leagueId === SCORING_LEAGUE.leagueId) return store;
  if (store.manifest.leagueId !== "" && !process.argv.includes("--restart")) return null;
  return { manifest: { season: INTEL_SEASON, leagueId: SCORING_LEAGUE.leagueId, updatedAt: "", days: [] }, marks: {} };
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
  const store = held();
  if (store === null) return console.log(`ratings: the file is marked from another league than ${SCORING_LEAGUE.leagueId}; --restart to mark it again.`);
  const [fixtures, scoring] = await Promise.all([fetchFixtures().then(mapFixtures), readScoring()]);
  const due = [...settledDays(fixtures)].filter(([day]) => !store.manifest.days.includes(day));
  if (due.length === 0) return console.log(`ratings: no day due; ${store.manifest.days.length} rated.`);
  if (scoring === null) throw new Error("the scoring league described no scoring");

  const snapshot = await getFootballSnapshot();
  const gameweeks = [...new Set(fixtures.filter((f) => f.status === "finished" && f.gameweek !== null).map((f) => f.gameweek!))];
  const rounds = new Map<number, PlayerMatchStats[]>();
  for (const gw of gameweeks) rounds.set(gw, mapLiveStats(await fetchLive(gw)));
  const results = clubResults(fixtures, [...rounds.values()], new Map(snapshot.players.map((p) => [p.id, p.clubId])));
  const bridge = readBridge();
  const idOfCode = new Map(snapshot.players.map((p) => [p.code, p.id]));
  const bridged = new Set(Object.values(bridge).flatMap((entry) => (isUnmapped(entry) || entry.fplCode == null ? [] : [entry.fplCode])));
  const today = londonDay(new Date());

  for (const [day, on] of due) {
    const figures = await dayFigures(day);
    const rated = new Set<number>();
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
      const mark = markOf(figures, scoring.rules, fantraxId, {
        minutes: figures.shorts.get(fantraxId)?.Min ?? 0,
        opponentClubId: club === fixture.homeClubId ? fixture.awayClubId : fixture.homeClubId,
        kickoff: fixture.kickoff,
        results,
      });
      (store.marks[String(code)] ??= {})[String(fixture.code)] = mark;
      rated.add(code);
    }
    // A day Fantrax answered short is asked again next run, until every man FPL says played it has his mark.
    const owed = menOwed(on, [...rounds.values()].flat(), snapshot.players, bridged);
    if (dayDone(rated, owed, day, today)) {
      store.manifest.days.push(day);
      console.log(`ratings: ${day}, ${rated.size} men rated across ${on.length} matches.`);
    } else {
      console.log(`ratings: ${day}, ${rated.size} of the ${owed.size} men owed a mark; asked again next run.`);
    }
  }
  store.manifest.updatedAt = new Date().toISOString();
  mkdirSync(RATINGS_ROOT, { recursive: true });
  writeFileSync(FILE, `${JSON.stringify(store)}\n`);
}

main().catch((error: unknown) => {
  console.error(`ratings: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
