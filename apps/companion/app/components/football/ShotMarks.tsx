import type { Shot } from "@epl/core";

// Shots, as marks on the grass.
//
// **Moved out of `players/analysis` on 10 Sep 2026, at the second use.** The
// match screen's own shot map wants exactly these marks and `prem/` reaching
// into `players/` for them is a layering the app does not otherwise have — so it
// comes here, to `components/football/`, which CODE_RULES §4 names as the home
// for anything drawn from the football layer. The two PITCHES stay separate and
// are meant to: one is a man attacking right across a season, the other is two
// sides of one match facing each other. What they share is the mark, and the
// mark is what moved.
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
// docs/rules/PRODUCT.md's rule that a signal is paired with a shape rather than left to
// colour. Three tiers and not five: goal, on target, off target. A reader can
// hold three apart on a pitch this size; the difference between a block and a
// miss is a number in a table, not a ring nobody can measure.
//
// **The marks are not interactive**, which settles the tap-target question
// rather than dodging it: a 7px target cannot meet the 44px thumb floor, so the
// map is a picture and the figures live in the table above it.

/** Radius in pitch units. See the header for both arithmetics. */
const MARK = { base: 0.7, span: 1.1, cap: 0.8, plain: 1.0 };

/** How each tier is drawn, in one place, so the key and the pitch cannot
 *  disagree about what a goal looks like. A key drawn from a second set of
 *  numbers is a key that goes quietly wrong the first time either is tuned. */
const DRAWN = {
  goal: { fill: "var(--color-cream)", width: 0.45, opacity: 0.95 },
  target: { fill: "none", width: 0.45, opacity: 0.95 },
  off: { fill: "none", width: 0.28, opacity: 0.55 },
} as const;

/** What each tier is called, in the order the key reads them — best first. */
const TIER_LABEL = [
  ["goal", "Goal"],
  ["target", "On target"],
  ["off", "Off target"],
] as const;

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

export default function Marks({
  shots,
  ink = "var(--color-cream)",
}: {
  shots: readonly Shot[];
  /** The mark's own colour. Cream by default — DESIGN §3's slot for ink on a
   *  colour plate, and what a single-player map wants, since its caption already
   *  names whose shots these are.
   *
   *  A MATCH map passes each side its club colour, because there two sets of
   *  marks share one pitch and nothing else could tell them apart. It changes the
   *  hue and never the grammar: fill still means scored, an outline still means
   *  it did not, and weight still separates on target from off. */
  ink?: string;
}) {
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
            fill={DRAWN[tier].fill === "none" ? "none" : ink}
            stroke={ink}
            strokeWidth={DRAWN[tier].width}
            opacity={DRAWN[tier].opacity}
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

/** The key: the marks themselves, at the size a middling chance draws.
 *
 *  Craig, 10 Sep 2026: *"maybe add a key for which shot was a goal"*. Drawn from
 *  `DRAWN` rather than described, so it is the same object as the thing on the
 *  grass — a key written in prose is a second statement of the encoding, and two
 *  statements drift.
 *
 *  Said ONCE for the section rather than under each pitch: both men are drawn by
 *  the same rules, so a key per pitch is the same fact twice. `Pitch.tsx` made
 *  the same call about its own key before it was retired.
 */
export function MarksKey() {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-3xs text-faint">
      {TIER_LABEL.map(([tier, label]) => (
        <li key={tier} className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="-1.6 -1.6 3.2 3.2" aria-hidden className="shrink-0">
            <circle
              r="1.2"
              fill={DRAWN[tier].fill}
              stroke="var(--color-cream)"
              strokeWidth={DRAWN[tier].width}
              opacity={DRAWN[tier].opacity}
            />
          </svg>
          {label}
        </li>
      ))}
      {/* The other half of the encoding, and the half a ring cannot show. */}
      <li className="text-faint">Size is the chance behind it</li>
    </ul>
  );
}
