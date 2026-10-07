import { clubById } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import PremShell from "../../Shell";
import { clubPlaces } from "../../places";
import Rounds, { byRound, panelRows } from "../../Rounds";
import { footballNow, seasonFixtures } from "../../../football";

// Every finished match by round, newest first; FPL scores a match in play, and that belongs on Live.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export default async function ResultsPage() {
  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);

  const played = byRound(fixtures.filter((fixture) => fixture.status === "finished")).reverse();
  const places = clubPlaces(fixtures, snapshot.clubs);


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

