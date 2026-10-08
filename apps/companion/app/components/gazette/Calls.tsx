import type { Club, PublishedStory } from "@epl/core";
import { DASH } from "@epl/core";
import { derbyBetween } from "@/app/derbies";
import Column from "./Column";
import Face from "./Face";
import Paragraphs from "./Paragraphs";
import { STANDING_HEAD } from "./heads";

// Lawro's calls as the page prints them, the way the BBC ran them: each tie, the man his line names
// first beside his words, and under them the desk's prediction. Figures sit in their own span
// because a figure is never letterspaced (DESIGN §6).

type Tie = NonNullable<PublishedStory["ties"]>[number];

export default function Calls({
  ties,
  record,
  named,
  clubs,
}: {
  ties: readonly Tie[];
  /** His season so far; absent before his first round is settled. */
  record: { right: number; called: number } | undefined;
  named: (teamId: string) => string;
  /** The round's clubs, for each picture's kit; absent prints the ties without pictures. */
  clubs?: Map<number, Club>;
}) {
  return (
    <Column
      title="The ties"
      aside={
        record === undefined ? null : (
          <>
            Season <span className="numeric">{record.right}</span> from <span className="numeric">{record.called}</span>
          </>
        )
      }
    >
      {/* The paper's own measure: one column on a phone, newspaper columns on a desk. */}
      <ul className="paper-columns">
        {ties.map((tie) => (
          <li key={`${tie.homeTeamId}-${tie.awayTeamId}`} className="flow-root break-inside-avoid border-b border-line py-5 last:border-b-0">
            <Derby home={tie.homeTeamId} away={tie.awayTeamId} />
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-ink">
              {named(tie.homeTeamId)} v {named(tie.awayTeamId)}
            </p>
            {tie.face !== undefined && clubs !== undefined ? (
              <div className="float-left mr-3 mt-2">
                <Face face={tie.face} clubs={clubs} rank="tie" />
              </div>
            ) : null}
            {tie.line !== "" ? <Paragraphs text={tie.line} className="pt-1 text-base leading-relaxed text-ink" /> : null}
            <p className="clear-left pt-1.5 font-sans text-2xs uppercase tracking-widest text-muted">
              Lawro&apos;s prediction: <span className="font-bold text-ink">{prediction(tie, named)}</span>
            </p>
          </li>
        ))}
      </ul>
    </Column>
  );
}

/** The derby a tie is, over its teams; nothing for a tie that is not one. */
function Derby({ home, away }: { home: string; away: string }) {
  const derby = derbyBetween(home, away);
  return derby === null ? null : <p className={`${STANDING_HEAD} pb-0.5`}>{derby.name}</p>;
}

/** The side he backs and his score, that side's figure first; a tie he could not call prints a dash. */
function prediction(tie: Tie, named: (teamId: string) => string) {
  if (typeof tie.callsTeamId !== "string") return DASH;
  const score = tie.score;
  const [mine, theirs] =
    score === undefined ? [null, null] : tie.callsTeamId === tie.homeTeamId ? [score.home, score.away] : [score.away, score.home];
  return (
    <>
      {named(tie.callsTeamId)}
      {mine === null ? null : <span className="numeric"> {mine}–{theirs}</span>}
    </>
  );
}
