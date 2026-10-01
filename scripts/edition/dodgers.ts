import {
  dodgers,
  fetchPlFixture,
  fetchPlRound,
  fetchPlTextstream,
  plFixtureCode,
  plMoments,
  plPlayerCodes,
  type Assignment,
  type Dodger,
  type DodgerMatch,
  type FootballSnapshot,
} from "@epl/core";
import { readScoring } from "../scoring";
import type { DeskFacts } from "./facts";

// The Points Dodgers' reads: every finished match's commentary this gameweek, two requests a match, only when the column is due.

export async function dodgersDesk(input: {
  assignments: readonly Assignment[];
  snapshot: FootballSnapshot;
  facts: DeskFacts;
  say: (message: string) => void;
}): Promise<Dodger[] | null> {
  if (!input.assignments.some((each) => each.kind === "dodgers")) return null;
  const { snapshot, say } = input;
  const round = await fetchPlRound(snapshot.gameweek).catch(() => null);
  if (round === null) return say("  dodgers: the Premier League's round would not load"), null;

  const optaToCode = new Map(snapshot.players.flatMap((p) => (p.optaCode === null ? [] : [[p.optaCode, p.code] as const])));
  const matches: DodgerMatch[] = [];
  for (const fixture of snapshot.fixtures.filter((f) => f.status === "finished")) {
    const pl = round.content.find((each) => plFixtureCode(each) === fixture.code);
    const read = pl === undefined ? null : await Promise.all([fetchPlFixture(pl.id), fetchPlTextstream(pl.id)]).catch(() => null);
    if (read === null) {
      say(`  dodgers: no commentary for fixture ${fixture.code}`);
      continue;
    }
    const [detail, stream] = read;
    matches.push({ fixture, moments: plMoments(stream.events.content, plPlayerCodes(detail, optaToCode)) });
  }

  return dodgers({
    teams: input.facts.teams,
    matches,
    scoring: (await readScoring())?.rules ?? null,
    clubOfCode: new Map(snapshot.players.map((p) => [p.code, p.clubId])),
  });
}
