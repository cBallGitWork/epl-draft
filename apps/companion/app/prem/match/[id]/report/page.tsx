import { Suspense } from "react";
import { worthReading } from "@epl/core";
import Nothing from "../../../../components/shell/Nothing";
import SkeletonRows from "../../../../components/shell/SkeletonRows";
import MatchShell from "../Shell";
import { readMatch } from "../match";
import type { Match } from "../match";
import { matchManEvents, matchReport, teamSheets } from "../../../../matchFeed";
import ReportSummary from "../ReportSummary";
import Line from "../Commentary";
import { PANEL_FLUSH } from "@/app/desk";

// The match, minute by minute, in Opta's own words.
//
// Craig, 5 Sep 2026: *"needs a match report section that we take from the
// premier league site."* CM's own fourth tab on this screen is `Match Report`
// (`cm0102/02.jpg`), and this is the absence DESIGN §2 has carried by name since
// the reference library was catalogued — *"a text-commentary matchday"*.
//
// **Their commentary, not their article.** The Premier League publishes written
// match reports too and 47 of 300 content items carry a body; we do not
// republish their prose (`docs/providers/live-reporting.md` records the
// judgement, and the Gazetta is fed the FACTS instead). This is the textstream —
// the minute-stamped event feed their own live blog is built from, the same
// source the Live tab's wire reads — which is a record of the match rather than
// somebody's writing about it.
//
// **The whole vocabulary.** `plCommentary` keeps every event, where
// `mapMatchEvents` reduces to seven kinds: the Live tab prints a wire and 1,083
// events a round is a firehose, but a report is one match and everything in it.
// Counted: 99 events in a complete match, 2,215 across gameweeks 1-3.

export const revalidate = 30;

export default async function MatchReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await readMatch(id);

  return (
    <MatchShell match={match} current="report">
      {/* Behind a boundary, because it is the one read on this page that is not
          already warm: the round resolves their fixture id from a cache the wire
          fills, and the stream itself is a second request. The head above it —
          the score, the strip, the ground — arrives without waiting. */}
      <Suspense fallback={<ReportWaiting />}>
        <Report match={match} />
      </Suspense>
    </MatchShell>
  );
}

async function Report({ match }: { match: Match }) {
  // All four off caches the page has already warmed — the round for their
  // fixture id, the detail for the sheets AND the events AND the changes, the
  // stream for the prose. The summary costs no request the report did not
  // already make.
  const { gameweek, code } = match.fixture;
  const [whole, sheets, events] = await Promise.all([
    matchReport(gameweek, code),
    teamSheets(gameweek, code, match.snapshot.players),
    matchManEvents(gameweek, code, match.snapshot.players),
  ]);

  // **The fouls come out here too** (Craig, 11 Sep 2026: *"to remove clutter, we
  // could hide all fouls/free kicks won"*). He asked for the behaviour rather
  // than a place for it, and `free kick won` + `free kick lost` are 42.9% of a
  // round's feed — a report of which nearly half is "Foul by X" is a record of
  // the fouls with a match between them. The emptiness test is asked of the
  // WHOLE feed, because a match with commentary but no incident outside the
  // fouls is still a match with commentary, and "no commentary" would be wrong.
  const lines = worthReading(whole);

  if (whole.length === 0) {
    return (
      <section className="cm-panel p-3">
        <Nothing
          title={match.fixture.status === "upcoming" ? "Not kicked off" : "No commentary"}
          code={`fixture ${match.fixture.code}`}
        >
          {match.fixture.status === "upcoming"
            ? "The Premier League opens a match's commentary when the teams are named. It will be here."
            : "Their commentary is not answering for this match. The scoresheet and the stats are unaffected."}
        </Nothing>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* What happened, before the account of how. Ninety-nine lines of
          commentary is a record of a match; a reader arriving after full time
          wants the four facts first. */}
      <ReportSummary sheets={sheets} events={events} byCode={match.byCode} />
      <ul className={`${PANEL_FLUSH} cm-rows`}>
        {lines.map((line) => (
          <Line key={line.id} line={line} />
        ))}
      </ul>
    </div>
  );
}

function ReportWaiting() {
  return (
    <div aria-busy>
      <SkeletonRows count={8} height="2.75rem" />
    </div>
  );
}
