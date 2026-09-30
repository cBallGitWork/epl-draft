import type { Pedigree } from "@epl/core";
import { signed } from "@epl/core";
import { MINOR_CAPS } from "@/app/desk";

// What the draft paid for him: the cyan line across the foot of Transfer, and the figure beside
// his pick in the status panel. Nothing for a league whose draft has not run.

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
export function Value({ against }: { against: number | null }) {
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
      className={`flex items-baseline gap-1 ${MINOR_CAPS} text-faint`}
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
