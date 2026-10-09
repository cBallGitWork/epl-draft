import type { Pedigree } from "@epl/core";
import { DASH, ordinal, signed } from "@epl/core";
import { MINOR_LABEL } from "@/app/desk";

// What the draft paid for him: the cyan line across the foot of Transfer, and the figure beside
// his pick in the status panel. Nothing for a league whose draft has not run.

/** Where he came from, across the foot of the tab in cyan, as the Profile closes (Craig, 4 Sep 2026). */
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

/** `Taken by Raccoons with the 11th pick, in round 2.`: the pick is overall; a drafter nobody can name loses the clause. */
function sentence(
  pedigree: Extract<Pedigree, { origin: "draft" }>,
  drafterName: string | null,
): string {
  const pick = `the ${ordinal(pedigree.overall)} pick, in round ${pedigree.round}`;
  return drafterName === null
    ? `Taken with ${pick}.`
    : `Taken by ${drafterName} with ${pick}.`;
}

/** Picks better than he cost, signed: red below, green above, a dash where Fantrax has no ranking for him. */
export function Value({ against }: { against: number | null }) {
  if (against === null)
    return <span className="numeric text-sm text-faint">{DASH}</span>;

  return (
    <span
      title={
        against === 0
          ? "Fantrax rank him exactly where he was taken, among the men this draft took."
          : `Fantrax rank him ${Math.abs(against)} ${
              Math.abs(against) === 1 ? "pick" : "picks"
            } ${against < 0 ? "below" : "above"} where he was taken, among the men this draft took.`
      }
      className={`flex items-baseline gap-1 ${MINOR_LABEL}`}
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
