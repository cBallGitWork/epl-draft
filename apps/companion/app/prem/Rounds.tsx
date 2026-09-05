import type { Club, Fixture } from "@epl/core";
import Match from "./Match";

// The season as rounds, each under its own head.
//
// Both lists in this section are this shape — Results is the finished rounds
// newest first, Fixtures is the rest soonest first — so the grouping is written
// once and each page decides which rounds and in what order. What differs
// between them is a filter and a `reverse`, which is not enough to be two
// components.

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
          {/* The round's own head in the chrome face, the way CM captions a
              block inside a panel — `league/results` sets the identical strip
              over its own rounds. Gameweeks and never periods: the two are one
              number all season, and printing one number under two names asks
              the reader to work out whether they are the same thing. */}
          <h2 className="cm-bevel flex h-7 items-center px-1.5 font-chrome text-2xs font-bold uppercase text-ink">
            Gameweek {round.gameweek}
          </h2>
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

/** Group a flat fixture list into rounds, ascending.
 *
 *  A fixture FPL has not assigned to a gameweek is left out rather than filed
 *  under nought: `Fixture.gameweek` is null exactly when the round is not yet
 *  decided, and a round headed "Gameweek 0" is a round that does not exist. */
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
      // Within a round, the order the matches were played — which is the order
      // a reader watched them in. An undated fixture sorts last rather than
      // first, where an empty string would put it.
      fixtures: list.sort((a, b) => (a.kickoff ?? "￿").localeCompare(b.kickoff ?? "￿")),
    }));
}

/** How many rows a list of rounds draws — every match, plus a head apiece.
 *
 *  Here rather than on the two pages that ask, because it is a fact about what
 *  a `Round` renders as and this is the module that knows. Capped: a
 *  thirty-eight round season would otherwise have the shell draw a panel tall
 *  enough for four hundred rows before a single one has arrived. */
export function panelRows(rounds: readonly Round[]): number {
  const rows = rounds.reduce((total, round) => total + round.fixtures.length + 1, 0);
  return Math.min(rows, PANEL_CAP);
}

/** Twenty, matching the table's own panel: the two screens in this section
 *  should not open at different heights. */
const PANEL_CAP = 20;
