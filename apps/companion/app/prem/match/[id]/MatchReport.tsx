import { Suspense } from "react";
import { worthReading } from "@epl/core";
import SkeletonRows from "../../../components/shell/SkeletonRows";
import { PANEL_FLUSH, SECTION_BAR } from "@/app/desk";
import Line from "./Commentary";
import type { Match } from "./match";
import { matchReport } from "../../../matchFeed";
import { matchPlayerNames } from "../../../matchDetail";

// The Overview's account of the match under the goals — its own boundary, so the scorers never wait on the stream.

export default function MatchReport({ match }: { match: Match }) {
  return (
    <Suspense fallback={<ReportWaiting />}>
      <Report match={match} />
    </Suspense>
  );
}

/** What happened, in Opta's own sentences with the fouls taken out — the page's length, so there is one scroll
 *  and not two (Craig, 23 Sep 2026). */
async function Report({ match }: { match: Match }) {
  const { gameweek, code } = match.fixture;
  const [whole, names] = await Promise.all([
    matchReport(gameweek, code),
    // The same men the Report tab marks, so a name is white on both screens.
    matchPlayerNames(gameweek, code),
  ]);
  const lines = worthReading(whole);
  if (lines.length === 0) return null;

  return (
    <section className={PANEL_FLUSH}>
      <h2 className={SECTION_BAR}>Match Report</h2>
      <ol className="cm-rows">
        {lines.map((line) => (
          <Line key={line.id} line={line} names={names} />
        ))}
      </ol>
    </section>
  );
}

function ReportWaiting() {
  return <SkeletonRows count={6} height="2.75rem" />;
}
