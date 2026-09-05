import { clubById, leagueTable } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import PremShell from "../../Shell";
import Rounds, { byRound, panelRows } from "../../Rounds";
import { footballNow, seasonFixtures } from "../../../football";

// What is still to come: every round not yet finished, soonest first.
//
// The split against Results is `status`, and a round in play appears on
// NEITHER: it has not finished, so it is not a result, and it is being played,
// so it is not a fixture. It is on Live, which is the screen for a number that
// moves.
//
// A fixture FPL has not dated shows TBC rather than a guess — the television
// has not picked it, and inventing a kickoff is the confident wrong answer.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function FixturesPage() {
  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);

  // Each club's place, for the row's blue block. The ARRAY ORDER of
  // `leagueTable` — a `TableRow` carries no rank of its own precisely because
  // the list IS the ranking — and pure, off fixtures this page already holds.
  const places = new Map(
    leagueTable(fixtures, snapshot.clubs).map((row, at) => [row.clubId, at + 1]),
  );

  const ahead = byRound(fixtures.filter((fixture) => fixture.status === "upcoming"));

  if (ahead.length === 0) {
    return (
      <PremShell current="fixtures">
        <Nothing title="Nothing left to play" code="no upcoming fixture">
          Every match FPL has published has been played. Next season&apos;s fixtures arrive when
          they are drawn.
        </Nothing>
      </PremShell>
    );
  }

  return (
    <PremShell current="fixtures"
      rows={panelRows(ahead)}
    >
      <Rounds rounds={ahead} clubs={clubById(snapshot)} places={places} />
    </PremShell>
  );
}

