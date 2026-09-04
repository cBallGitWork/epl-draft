import type { Pedigree } from "@epl/core";
import { signed } from "@epl/core";
import { FACT, FACT_LABEL } from "@/app/desk";
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

export default function Pedigree({ pedigree }: { pedigree: Pedigree }) {
  // **Nothing at all for a man the draft did not take.** It used to draw a
  // sentence — "Undrafted. He came off the waiver wire, which cost a claim
  // rather than a pick." — which is a paragraph in a panel restating what the
  // Business list below already shows as a dated claim. A block with nothing to
  // add is the surplus this screen keeps being asked to lose.
  if (pedigree.origin !== "draft") return null;

  // **A sentence, in cyan, across the foot** (Craig, 4 Sep 2026: *"make this a
  // proper stentence … put it in cyan at the bottom like profile picture, and
  // bigger"*). It read `Round 1, pick 1 · 123` — three facts separated by
  // punctuation, which is a data row wearing prose clothes. The Profile's
  // position line is the shape it now copies: `cm9900/11.jpg` closes a screen
  // with one cyan line saying what the screen was about, and on this tab what it
  // is about is where he came from.
  return (
    <Section title="Draft">
      <div className={FACT}>
        <p className={`${FACT_LABEL} text-sm`}>How his cost compares</p>
        <Value against={pedigree.against} />
      </div>
    </Section>
  );
}

/** Where he came from, across the foot of the tab in cyan.
 *
 *  **Its own export so the page can put it LAST** (Craig, 4 Sep 2026: *"put it
 *  in cyan at the bottom like profile picture"*). Rendered inside `Pedigree` it
 *  landed above the Business list, which is neither the bottom nor beside the
 *  figure it belongs to. The Profile's position line is the shape: one cyan
 *  sentence closing the screen, saying what the screen was about. */
export function DraftLine({
  pedigree,
  drafterName,
}: {
  pedigree: Pedigree;
  drafterName: string | null;
}) {
  if (pedigree.origin !== "draft") return null;
  return (
    <p className="cm-panel cm-title px-2 py-2 text-center font-chrome text-base font-bold text-info lg:text-2xl">
      {sentence(pedigree, drafterName)}
    </p>
  );
}

/** Where he came from, written out.
 *
 *  `Taken by 123 with pick 1 of round 1.` — the drafter first, because on this
 *  tab the manager is the subject and the pick is what he spent. A pick nobody
 *  can be named for loses the clause rather than the sentence. */
function sentence(
  pedigree: Extract<Pedigree, { origin: "draft" }>,
  drafterName: string | null,
): string {
  const pick = `pick ${pedigree.overall} of round ${pedigree.round}`;
  return drafterName === null
    ? `Taken with ${pick}.`
    : `Taken by ${drafterName} with ${pick}.`;
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
