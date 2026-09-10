import { Suspense } from "react";
import type { PlCommentaryLine } from "@epl/core";
import Nothing from "../../../../components/shell/Nothing";
import SkeletonRows from "../../../../components/shell/SkeletonRows";
import MatchShell from "../Shell";
import { readMatch } from "../match";
import type { Match } from "../match";
import { matchReport } from "../../../../commentary";
import { PANEL_FLUSH, ROW_NAME, SMALL_CAPS } from "@/app/desk";

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
  const lines =
    match.fixture.gameweek === null
      ? []
      : await matchReport(match.fixture.gameweek, match.fixture.code);

  if (lines.length === 0) {
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
    <ul className={`${PANEL_FLUSH} cm-rows`}>
      {lines.map((line) => (
        <Line key={line.id} line={line} />
      ))}
    </ul>
  );
}

/** One line: the minute in CM's blue block, what it was, and what happened.
 *
 *  The same three columns the Live tab's wire uses, because it is the same
 *  object read a different way — a minute, a kind, and a sentence. What differs
 *  is that the sentence here is Opta's own and the wire's is a name.
 *
 *  **The loud kinds are loud and the rest are not.** A commentary feed is mostly
 *  corners and blocked shots; printing all of it at one weight is a wall, which
 *  is the same argument `Wire` makes for filtering rather than printing 1,083
 *  events. Here nothing is filtered — a report is everything — so the emphasis
 *  does the work instead. */
function Line({ line }: { line: PlCommentaryLine }) {
  const word = LOUD[line.type];
  return (
    <li className="flex min-h-11 items-stretch gap-2 lg:min-h-9">
      {/* `w-11`, because stoppage time reads `90+7` and CM's block is a fixed
          chip. The wire's is `w-9` and never has to hold one. */}
      <span className="cm-index numeric flex w-11 shrink-0 items-center justify-center">
        {line.minute}&prime;
      </span>
      {/* **A label only where it is a MARKER**, which is the fix and not a
          tidy-up: Opta's own sentence already says what happened — "Foul by
          Lewis Cook (Bournemouth)" under a label reading FREE KICK LOST is the
          same fact twice, and the label was three lines tall to say it. Their
          type strings are written for a machine ("attempt saved", "free kick
          won"), and the seven that change a match are the seven worth calling
          out. The rest is prose, and prose is what a report is. */}
      {word === undefined ? null : (
        <span className={`flex shrink-0 items-center ${SMALL_CAPS} ${TONE[line.type] ?? "text-ink"}`}>
          {word}
        </span>
      )}
      <span
        className={`flex min-w-0 flex-1 items-center py-1 ${
          word === undefined ? "text-2xs text-muted" : `${ROW_NAME} text-ink`
        }`}
      >
        {line.text}
      </span>
    </li>
  );
}

/** The things that change a match, and the word this app calls each one.
 *
 *  Keyed on Opta's own type strings, measured across gameweeks 1-3 rather than
 *  guessed. The VALUES are `matchday/Wire`'s vocabulary — the same seven events
 *  get the same seven words on both screens, which is the unification this run
 *  has been doing everywhere else.
 *
 *  A type this map does not name still prints; it is simply quiet, and has no
 *  label at all. */
const LOUD: Record<string, string> = {
  goal: "Goal",
  "penalty goal": "Pen",
  "own goal": "OG",
  "VAR cancelled goal": "VAR",
  "yellow card": "Booked",
  "red card": "Sent off",
  substitution: "Sub",
};

/** A red card and an own goal are the negative slot; a yellow one is NOT the
 *  accent slot, because yellow means "yours" on five other screens and a second
 *  meaning for it would break the one reading aid they share (`Wire` carries the
 *  same ruling). */
const TONE: Record<string, string> = {
  "red card": "text-bad",
  "own goal": "text-bad",
  "VAR cancelled goal": "text-bad",
};

function ReportWaiting() {
  return (
    <div aria-busy>
      <SkeletonRows count={8} height="2.75rem" />
    </div>
  );
}
