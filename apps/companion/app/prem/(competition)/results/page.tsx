import { clubById, leagueTable } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import PremShell from "../../Shell";
import Rounds, { byRound, panelRows } from "../../Rounds";
import { footballNow, seasonFixtures } from "../../../football";

// What has already happened: every finished round, newest first.
//
// **Finished, and not merely started.** FPL writes a running score onto a match
// in play, and a round still being played belongs on Live, where a number that
// moves is meant to move. This page is the archive and everything on it is
// final — the same line `league/results` draws for the same reason.
//
// No provider call of its own: `seasonFixtures` is the whole season in one read
// and is already cached for the league schedule and the table.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function ResultsPage() {
  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);

  const played = byRound(fixtures.filter((fixture) => fixture.status === "finished")).reverse();
  // Each club's place, for the row's blue block. The ARRAY ORDER of
  // `leagueTable` — a `TableRow` carries no rank of its own precisely because
  // the list IS the ranking — and pure, off fixtures this page already holds.
  const places = new Map(
    leagueTable(fixtures, snapshot.clubs).map((row, at) => [row.clubId, at + 1]),
  );


  if (played.length === 0) {
    return (
      <PremShell current="results">
        <Nothing title="Nothing played yet" code="no finished fixture">
          Results appear here as soon as a round finishes. A round being played is on Live,
          where its score is meant to move.
        </Nothing>
      </PremShell>
    );
  }

  return (
    <PremShell current="results"
      rows={panelRows(played)}
    >
      <Rounds rounds={played} clubs={clubById(snapshot)} places={places} />
    </PremShell>
  );
}

