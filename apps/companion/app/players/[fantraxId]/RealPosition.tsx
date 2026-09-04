import type { IntelPlayer } from "@epl/core";
import { realPositionLabel } from "../../realPositions";

// The cyan line at the foot of a Championship Manager profile: what he actually
// plays. `cm9900/11.jpg` reads `Defender/Defensive Midfielder (Left/Centre)`.
//
// **The first thing in the app that MEANS what the cyan slot means.** DESIGN §3
// retired "cyan means a person" on 3 Sep 2026 — a name in CM is white — and left
// the slot for *"a derived reading — ours rather than recorded"*, "deliberately
// near-empty until a derived figure claims it". A real position is exactly that:
// the sister repo weighs FotMob, Understat, SofaScore and recent Premier League
// starts and settles a role no provider states as a fact. §3 also names Position
// among CM's own cyan columns (`12.jpg`), so the reference and the palette agree.
//
// **Near-empty, not empty**, and the difference is checkable: `league/Chips.tsx`
// gives an assist the cyan chip, and `fpl/FplPitch.tsx` and `fpl/page.tsx` give
// it to the captain's armband. A captaincy and an assist are both RECORDED, so
// all three are pre-existing occupants of a slot that now has a meaning they do
// not fit. Filing them is not this screen's job; claiming the slot was empty
// would have been a claim the tree contradicts.
//
// It wears `.cm-title` for the shadow. DESIGN §6 says that class is "worn by
// exactly three things" and the tree already says seven — `SeasonGrid`,
// `Eleven`, `Sheet` and `squad/[teamId]/next` joined the two `PageHeader` bars
// and `Caption` before this. The enumeration is stale rather than this line
// being a breach, and §6 wants an edit that says what actually earns it.
//
// **Never FPL's `element_type`.** That is a fantasy classification, which is why
// position left the football layer at all — and it is why 146 of 651 men have
// null here rather than a guess. The exporter refuses to pass off DEF as
// "defender", and so does this.

export default function RealPosition({ position }: { position: IntelPlayer | null }) {
  const real = position?.position;
  if (!real) {
    // Two different silences and this says which. A man with no row at all is
    // not the same as one whose only position came from FPL's own fantasy
    // letter, and the export carries `positionSource` precisely so a screen can
    // say WHY there is none rather than only that there is none.
    return (
      <p className="cm-panel px-2 py-1 text-center text-2xs text-faint">
        {position === null
          ? "No position on file for him."
          : "No real position — FPL's classification is the only one on file, and it is not a fact about the footballer."}
      </p>
    );
  }

  // **`secondaryPositions` only, never `canCover`.** The depth chart is who
  // could fill in, not where a man plays — Maguire's is `DM/LB/RB`, and it was
  // printed here for one commit (Craig, 4 Sep 2026: "Maguire not a dm or rb").
  // 70 of 651 have a real secondary; the rest print one role, which is the true
  // answer rather than a short one.
  const label = realPositionLabel(real, position.secondaryPositions);

  // **On a plate, not on the photograph.** DESIGN §2: nothing prints text on the
  // bare ground. This was a bare centred line until `groundfit.mjs` was repaired
  // on 4 Sep 2026 and could report for the first time — it had been counting
  // body's opaque background and passing everything. The line is the marquee
  // element of the screen and was the loudest thing on the picture.
  return (
    <p className="cm-panel cm-title px-2 py-1 text-center font-chrome text-sm font-bold text-info lg:text-base">
      {label}
    </p>
  );
}
