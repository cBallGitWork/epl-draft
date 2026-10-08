import type { Club, Fixture } from "@epl/core";
import Match from "./Match";
import RoundHead from "../components/shell/RoundHead";
import { PANEL_ROWS } from "./Shell";

// The season as rounds, each under its own head; Results and Fixtures pick the rounds and the order.

export interface Round {
  gameweek: number;
  fixtures: Fixture[];
}

export default function Rounds({
  rounds,
  clubs,
  places,
}: {
  rounds: readonly Round[];
  clubs: Map<number, Club>;
  /** Each club's place in the table, for the row's blue block. Built by the
   *  page, because it is the page that holds the season's fixtures. */
  places: Map<number, number>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {rounds.map((round) => (
        <section key={round.gameweek} className="flex flex-col">
          <RoundHead gameweek={round.gameweek} />
          <div className="cm-rows flex flex-col">
            {round.fixtures.map((fixture) => (
              <Match key={fixture.id} fixture={fixture} clubs={clubs} places={places} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Groups fixtures into ascending rounds; one with no gameweek yet is left out, not filed under nought. */
export function byRound(fixtures: readonly Fixture[]): Round[] {
  const rounds = new Map<number, Fixture[]>();
  for (const fixture of fixtures) {
    if (fixture.gameweek === null) continue;
    const round = rounds.get(fixture.gameweek) ?? [];
    round.push(fixture);
    rounds.set(fixture.gameweek, round);
  }

  return [...rounds.entries()]
    .sort(([a], [b]) => a - b)
    .map(([gameweek, list]) => ({
      gameweek,
      // Kick-off order; an undated fixture sorts last, not first as an empty string would.
      fixtures: list.sort((a, b) => (a.kickoff ?? "￿").localeCompare(b.kickoff ?? "￿")),
    }));
}

/** Rows the rounds draw, a match each plus a head apiece; capped at the table's panel, so the section's screens open
 *  at one height and a season is not 400 rows tall. */
export function panelRows(rounds: readonly Round[]): number {
  const rows = rounds.reduce((total, round) => total + round.fixtures.length + 1, 0);
  return Math.min(rows, PANEL_ROWS);
}
