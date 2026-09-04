import type { Pedigree } from "@epl/core";
import { signed } from "@epl/core";
import { FACT } from "@/app/desk";
import Section from "../../components/shell/Section";

// What the draft paid for him.
//
// **Nothing on screen for a league whose draft has not run**, and that is not a
// missing state. Our real league drafts on 10 Oct, so for nine weeks there is no
// board to read — a block saying so would be a heading over a fact that does not
// exist yet, on all 671 profiles at once.
//
// The other two both print. A man nobody drafted came off the wire, which is a
// pedigree and the second most interesting one there is.

export default function Pedigree({
  pedigree,
  drafterName,
}: {
  pedigree: Pedigree;
  /** Who spent the pick. Null when the pool read could not name them — the pick
   *  is still worth printing without a name on it. */
  drafterName: string | null;
}) {
  if (pedigree.origin === "unknown") return null;

  return (
    <Section title="Draft">
      <div className={FACT}>
        {pedigree.origin === "waiver" ? (
          <p className="text-sm text-muted">
            Undrafted. He came off the waiver wire, which cost a claim rather
            than a pick.
          </p>
        ) : (
          <>
            <p className="min-w-0 flex-1 text-sm text-muted">
              Round {pedigree.round}, pick {pedigree.overall}
              {drafterName === null ? null : <> · {drafterName}</>}
            </p>
            <Value against={pedigree.against} />
          </>
        )}
      </div>
    </Section>
  );
}

/** Picks better than he cost, signed.
 *
 *  **Red for a pick that has not repaid itself, and the loud ink for one that
 *  has.** The red slot means "a loss, a doubt, a negative" (DESIGN §3) and this
 *  is the third of those; there is no green because there is no green token
 *  yet (§8), and the accent is not it. A dash when Fantrax has no ranking for
 *  him — nought is a real answer here and means he is exactly what he cost. */
function Value({ against }: { against: number | null }) {
  if (against === null)
    return <span className="numeric text-sm text-faint">—</span>;

  return (
    <span
      title={
        against === 0
          ? "Fantrax rank him exactly where he was taken, among the men this draft took."
          : `Fantrax rank him ${Math.abs(against)} ${
              Math.abs(against) === 1 ? "pick" : "picks"
            } ${against < 0 ? "below" : "above"} where he was taken, among the men this draft took.`
      }
      className="flex items-baseline gap-1 text-3xs font-bold uppercase text-faint"
    >
      <span
        className={`numeric text-sm ${
          against < 0 ? "text-bad" : against > 0 ? "text-up" : "text-ink"
        }`}
      >
        {signed(against)}
      </span>
      on his pick
    </span>
  );
}
