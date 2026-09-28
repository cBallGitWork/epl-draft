import type { Fixture, FootballPlayer, MatchEvent, PlayerMatchStats } from "../types";
import { creditSide, type AssistKinds } from "./assistKinds";
import { streamCredits } from "./assists";
import type { PlGoal } from "./goals";
import { mapMatchEvents } from "./map";
import type { RawPlEvent } from "./raw";

// The round wire's reads of Opta's per-fixture commentary, pure: the app fetches each played
// fixture's stream once and files it under FPL's fixture CODE, the key every event already carries.

/** One fixture's commentary, and its kick-off in epoch milliseconds from the round read. */
export interface FixtureStream {
  events: readonly RawPlEvent[];
  kickoffMillis: number | null;
}

/** Every red card in the round, oldest first per fixture. */
export function streamRedCards(
  streams: ReadonlyMap<number, FixtureStream>,
  codes: Map<number, number>,
): MatchEvent[] {
  return [...streams].flatMap(([fixtureCode, stream]) =>
    mapMatchEvents(stream.events, fixtureCode, codes, stream.kickoffMillis).filter(
      (event) => event.kind === "red-card",
    ),
  );
}

/** The round's goals with the assists FPL pays and Opta never placed — a penalty won, an own
 *  goal forced, a rebound. The stats league's kinds first, then the commentary, then arithmetic
 *  (`creditSide`). Per side, because that arithmetic is a side's. */
export function creditRoundAssists(
  goals: readonly MatchEvent[],
  players: readonly Pick<FootballPlayer, "id" | "code" | "clubId">[],
  fixtures: readonly Pick<Fixture, "id" | "code" | "homeClubId" | "awayClubId">[],
  stats: readonly Pick<PlayerMatchStats, "playerId" | "fixtureId" | "assists">[],
  streams: ReadonlyMap<number, FixtureStream>,
  codes: ReadonlyMap<number, number>,
  kinds: ReadonlyMap<number, AssistKinds>,
): MatchEvent[] {
  const clubOf = new Map(players.map((player) => [player.code, player.clubId]));
  const codeOf = new Map(players.map((player) => [player.id, player.code]));
  const byCode = new Map(fixtures.map((fixture) => [fixture.code, fixture]));

  /** Which club a goal counts for: the scorer's, unless he put it in his own net. */
  const sideOf = (goal: MatchEvent): number | undefined => {
    const scorer = goal.players[0];
    const club = scorer === null || scorer === undefined ? undefined : clubOf.get(scorer);
    const fixture = byCode.get(goal.fixtureCode);
    if (club === undefined || fixture === undefined) return undefined;
    if (goal.kind !== "own-goal") return club;
    return club === fixture.homeClubId ? fixture.awayClubId : fixture.homeClubId;
  };

  const sides = new Map<string, MatchEvent[]>();
  const loose: MatchEvent[] = [];
  for (const goal of goals) {
    const side = sideOf(goal);
    if (side === undefined) {
      loose.push(goal);
      continue;
    }
    const key = `${goal.fixtureCode}:${side}`;
    sides.set(key, [...(sides.get(key) ?? []), goal]);
  }

  const credited = [...sides].map(([key, theirs]) => {
    const [fixtureCode, side] = key.split(":").map(Number);
    const fixtureId = byCode.get(fixtureCode)?.id;
    if (fixtureId === undefined) return theirs;

    // What FPL paid THIS side in THIS match; a side's arithmetic may not see the other's.
    const paid = new Map<number, number>();
    for (const line of stats) {
      if (line.fixtureId !== fixtureId || line.assists === 0) continue;
      const code = codeOf.get(line.playerId);
      if (code === undefined || clubOf.get(code) !== side) continue;
      paid.set(code, line.assists);
    }

    const asGoals: PlGoal[] = theirs.map((goal) => ({
      minute: Number.parseInt(goal.minute, 10),
      teamId: side,
      scorer: goal.players[0] ?? null,
      assister: goal.players[1] ?? null,
      own: goal.kind === "own-goal",
      penalty: goal.kind === "penalty-goal",
    }));
    const events = streams.get(fixtureCode)?.events ?? [];
    const settled = creditSide(asGoals, streamCredits(events, codes), kinds, paid);

    return theirs.map((goal, at) =>
      goal.players[1] == null && settled[at].assister !== null
        ? { ...goal, players: [goal.players[0] ?? null, settled[at].assister] }
        : goal,
    );
  });
  return [...credited.flat(), ...loose];
}
