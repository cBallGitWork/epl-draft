import type { Shot } from "@epl/core";

// A man's shots, as marks on the grass.
//
// **Small, and the arithmetic is the point.** The pitch is 358px wide at 390 and
// about 530px in a half-width column on a desk, so one viewBox unit is 3.58px
// and 5.3px. The role pitch this replaced drew `r="2.6"` — a 19px blob under a
// thumb and 57px across on a full-width desk, which is what Craig meant by
// *"the plots are far too big"*. A base radius of **1.0** is 7px and 11px: a
// mark rather than a blot, at both widths, with no breakpoint.
//
// **Radius carries xG, by its SQUARE ROOT, so that AREA is proportional.** A
// radius proportional to xG makes a 0.4 chance look four times a 0.1 rather than
// twice it, which is the oldest mistake in drawing a scatter.
//
// **Outcome is fill and weight, never a new hue.** DESIGN §3 gives every colour
// one meaning and none of them means "a shot was saved": `--color-bad` is a
// loss, a doubt, a negative, and a striker's blocked effort is none of those.
// Green turf also refuses most of the palette. So the marks are all cream — the
// slot for ink on a colour plate — and separate on fill and weight, which is
// PRODUCT.md's rule that a signal is paired with a shape rather than left to
// colour. Three tiers and not five: goal, on target, off target. A reader can
// hold three apart on a pitch this size; the difference between a block and a
// miss is a number in a table, not a ring nobody can measure.
//
// **The marks are not interactive**, which settles the tap-target question
// rather than dodging it: a 7px target cannot meet the 44px thumb floor, so the
// map is a picture and the figures live in the table above it.

/** Radius in pitch units. See the header for both arithmetics. */
const MARK = { base: 0.7, span: 1.1, cap: 0.8, plain: 1.0 };

/** How a shot is drawn, by what became of it. Written out literally in a
 *  `Record` rather than composed — the Tailwind v4 trap does not reach SVG
 *  attributes, but a lookup a reader can see beats a rule they have to derive. */
const TIER: Record<Shot["outcome"], "goal" | "target" | "off"> = {
  goal: "goal",
  post: "target",
  save: "target",
  block: "off",
  miss: "off",
};

export default function Marks({ shots }: { shots: readonly Shot[] }) {
  return (
    <g>
      {shots.map((shot, n) => {
        const tier = TIER[shot.outcome];
        const r = radius(shot.xg);
        return (
          <circle
            // Two shots can share a minute and a spot — a rebound is the same
            // man, the same second, a foot away — so the index is the only key
            // that is unique by construction.
            key={n}
            cx={shot.x}
            cy={(shot.y / 100) * 64}
            r={r}
            fill={tier === "goal" ? "var(--color-cream)" : "none"}
            stroke="var(--color-cream)"
            strokeWidth={tier === "off" ? 0.28 : 0.45}
            opacity={tier === "off" ? 0.55 : 0.95}
          />
        );
      })}
    </g>
  );
}

/** A mark's radius, from the chance behind it.
 *
 *  Capped at 0.8 because a penalty is 0.79 and everything above it is a tap-in
 *  that would otherwise draw a disc the size of the six-yard box. A shot with no
 *  xG — five of 824 — takes the plain radius rather than the smallest one: we do
 *  not know what it was worth, and drawing it as though we knew it was worthless
 *  is the confident wrong answer. */
function radius(xg: number | null): number {
  if (xg === null) return MARK.plain;
  return MARK.base + MARK.span * Math.sqrt(Math.min(xg, MARK.cap) / MARK.cap);
}
