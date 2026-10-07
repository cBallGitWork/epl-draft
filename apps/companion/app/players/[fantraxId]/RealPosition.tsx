import type { IntelPlayer } from "@epl/core";
import { realPositionLabel } from "../../realPositions";

// The cyan line at the foot of a CM profile (`cm9900/11.jpg`): the role the sister repo settled, a derived reading.
// Never FPL's `element_type`, which is a fantasy classification; a man with only that has no line.

export default function RealPosition({ position }: { position: IntelPlayer | null }) {
  const real = position?.position;
  if (!real) {
    // Says which silence: no row at all, or only FPL's fantasy letter.
    return (
      <p className="cm-panel px-2 py-1 text-center text-2xs text-faint">
        {position === null
          ? "No position on file for him."
          : "No real position — FPL's classification is the only one on file, and it is not a fact about the footballer."}
      </p>
    );
  }

  // `secondaryPositions` only: `canCover` is who could fill in, not where he plays (Craig, 4 Sep 2026).
  const label = realPositionLabel(real, position.secondaryPositions);

  // On a plate (nothing prints on the bare ground), big and last (Craig, 4 Sep 2026).
  return (
    <p className="cm-panel cm-title px-2 py-2 text-center font-chrome text-base font-bold text-info lg:text-2xl">
      {label}
    </p>
  );
}
