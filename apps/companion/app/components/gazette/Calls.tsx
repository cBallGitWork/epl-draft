import type { PublishedStory } from "@epl/core";
import { DASH } from "@epl/core";
import Column from "./Column";

// Lawro's calls as the page prints them: each tie, his words, and under them the desk's prediction.
// Figures sit in their own span because a figure is never letterspaced (DESIGN §6).

type Tie = NonNullable<PublishedStory["ties"]>[number];

export default function Calls({
  ties,
  record,
  named,
}: {
  ties: readonly Tie[];
  /** His season so far; absent before his first round is settled. */
  record: { right: number; called: number } | undefined;
  named: (teamId: string) => string;
}) {
  return (
    <Column
      title="The ties"
      aside={record === undefined ? null : <span className="numeric">Season {record.right} from {record.called}</span>}
    >
      {/* The paper's own measure: one column on a phone, newspaper columns on a desk. */}
      <ul className="paper-columns">
        {ties.map((tie) => (
          <li key={`${tie.homeTeamId}-${tie.awayTeamId}`} className="break-inside-avoid py-3">
            <p className="font-sans text-2xs uppercase tracking-widest text-faint">
              {named(tie.homeTeamId)} v {named(tie.awayTeamId)}
            </p>
            {tie.line !== "" ? <p className="pt-1 text-base leading-relaxed text-ink">{tie.line}</p> : null}
            <p className="pt-1.5 font-sans text-2xs uppercase tracking-widest text-muted">
              Lawro&apos;s prediction: <span className="font-bold text-ink">{prediction(tie, named)}</span>
            </p>
          </li>
        ))}
      </ul>
    </Column>
  );
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
      {mine === null ? null : <span className="numeric tracking-normal"> {mine}-{theirs}</span>}
    </>
  );
}
