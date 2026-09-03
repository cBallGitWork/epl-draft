import type { Club, Fixture } from "@epl/core";
import Match from "../../Match";

// One club's season, played and to come, in the order it runs.
//
// **A flat list and not `prem/Rounds`.** A club plays once a round, so grouping
// this by round is thirty-eight headings over thirty-eight rows — the heading
// would carry the only thing the row does not, which is the gameweek, so the
// gameweek goes in the index block instead. That block takes the club's own
// colour, because `ClubShell` scopes `--cm-index` to it: exactly what CM does
// when a screen belongs to a club rather than to the division.
//
// **The round block is narrow under a thumb, and that is a budget rather than a
// taste.** `Match` splits what is left of the row between two club names either
// side of a fixed score column, so every pixel this block takes comes out of
// both names at once — at `w-12` each club had 41px and "ARS" truncated to "A…".
// At `w-9` with a tighter gap they have 49, which fits. The alternative was
// narrowing `Match`'s score column, and that would have changed two shipped
// screens to fix a third.
//
// **A live match is marked here rather than inside `Match`.** `Match` prints a
// score the moment FPL has one, which is right on `/prem/results` and
// `/prem/fixtures` because both exclude a round in play — a club's whole season
// does not, and a running score with no tense reads as a final one. The marker
// is this file's business; giving `Match` a prop two other callers would never
// pass is the parameter CODE_RULES §1 forbids.

export default function Run({
  fixtures,
  clubs,
}: {
  fixtures: readonly Fixture[];
  clubs: Map<number, Club>;
}) {
  return (
    <div className="cm-rows flex flex-col">
      {fixtures.map((fixture) => (
        <div key={fixture.id} className="flex items-center gap-1 lg:gap-2">
          <span className="cm-index numeric flex h-6 w-9 shrink-0 items-center justify-center text-3xs font-bold lg:w-12 lg:text-2xs">
            {fixture.gameweek === null ? "—" : `GW${fixture.gameweek}`}
          </span>
          {/* A div, not a span: `Match`'s root is a block, and a block inside
              an inline element is invalid nesting the parser rewrites — which
              collapsed every side to a few pixels and truncated "ARS" to "A…".
              */}
          <div className="min-w-0 flex-1">
            <Match fixture={fixture} clubs={clubs} />
          </div>
          {fixture.status === "live" ? (
            <span className="shrink-0 pr-2 text-3xs font-bold uppercase text-live">Live</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
