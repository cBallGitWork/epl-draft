import type { Club } from "@epl/core";
import { clubColours, inkOn } from "@epl/core";
import Section from "../../components/shell/Section";
import { pitchSpot } from "../../pitchSpot";

// Where each of them plays, on one pitch, in opposing directions.
//
// Fantasy Football Scout's Player Maps is the reference Craig sent, and its own
// caption is the instruction: "compare two players in opposing directions, with
// each standalone map normalised from defence on the left to attack on the
// right". Its picture puts one man's marks at the left goal and the other's at
// the right — a map per half rather than two overlaid.
//
// **Points only, colour-coded, with a key** (Craig, 6 Sep 2026). Names rode on
// the pitch for one build and collided the moment two roles were close; a key
// says whose is whose once, off the pitch, instead of twice on it.
//
// **The club's own colour, and a SHAPE as well.** The bar above is already each
// man on his club's plate, so the pitch reading the same colours means the key
// is confirming what the reader has just been told rather than teaching a new
// code. Two clubs can be near-identical reds, though — so the first man is a
// circle and the second a diamond, which is PRODUCT.md's accessibility rule
// applied rather than quoted: pair every colour signal with a label, shape or
// position.
//
// **One point each is all we can honestly draw today.** FPL publishes no
// location at all, the Premier League's own feed is per-team, and the sister
// repo's SofaScore shots and average positions are staged and NOT exported —
// `docs/providers/intel-export.md` is the contract that will fill them. A
// scatter of invented points would look exactly like a real one, which is the
// confident wrong answer PRODUCT.md's fourth principle exists to forbid. So this
// plots the locational fact we do hold: the sister repo's weighted role. The
// stat filter Craig asked for — shots, recoveries — arrives with those files and
// not before; a control offering maps that cannot be drawn is worse than none.

/** One man on the pitch. `position` is null for a role the table cannot place,
 *  and the caption says so rather than dropping him silently. Not exported: the
 *  page passes a literal and structural typing checks it. */
interface Marker {
  name: string;
  club: Club | undefined;
  position: string | null;
}

export default function Pitch({ a, b }: { a: Marker; b: Marker }) {
  const left = pitchSpot(a.position);
  const right = pitchSpot(b.position);
  if (left === null && right === null) return null;

  const inkA = clubColours(a.club?.shortName ?? "").primary;
  const inkB = clubColours(b.club?.shortName ?? "").primary;

  return (
    <Section title="Where they play" aside="Sister repo's role">
      {/* **Not `.pitch`.** That class is the squad and head-to-head pitch's own
          frame — `pitch.css` gives it a PORTRAIT `aspect-ratio` (CM draws its
          pitch about 1.2 times as tall as it is wide) and `overflow: hidden`, so
          a landscape map inside it sat in a portrait box with 284px of dead
          grass under it, measured. It was borrowed here for the colour tokens,
          which turn out not to need it: `--color-pitch-*` are `@theme` tokens
          and global, and the class's other job — restoring desk tokens inside a
          colour plate on the PAPER (DESIGN §5) — is for a register this route is
          not on. */}
      <figure className="flex flex-col gap-1.5">
        <svg
          viewBox="0 0 100 64"
          className="w-full"
          role="img"
          aria-label={`${a.name} and ${b.name} by the position each plays`}
        >
          <rect width="100" height="64" fill="var(--color-pitch-turf)" />
          {/* The mown bands, which is what makes it read as a pitch rather than
              as a green box — `tokens.css` carries the pair and the argument. */}
          {[0, 2, 4, 6, 8].map((band) => (
            <rect key={band} x={band * 10} width="10" height="64" fill="var(--color-pitch-mow)" />
          ))}
          <g fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.4">
            <rect x="1" y="1" width="98" height="62" />
            <line x1="50" y1="1" x2="50" y2="63" />
            <circle cx="50" cy="32" r="8" />
            <rect x="1" y="16" width="12" height="32" />
            <rect x="87" y="16" width="12" height="32" />
          </g>

          {/* **Each man gets his own HALF, attacking his own goal.** Overlaying
              them was the first build and it was unreadable: a defender mirrored
              onto the far end lands exactly where the other man's attacking
              midfielder stands. Halving the axis cannot collide — the deepest
              role sits by the halfway line and the most advanced by his own
              goal, so the two are read outward from the middle. */}
          {left === null ? null : (
            <Dot x={50 - left.x / 2} y={left.y} fill={inkA} />
          )}
          {right === null ? null : (
            <Dot x={50 + right.x / 2} y={right.y} fill={inkB} diamond />
          )}
        </svg>

        {/* The key, off the pitch, said once. */}
        <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 text-3xs">
          <Key name={a.name} fill={inkA} />
          <Key name={b.name} fill={inkB} diamond />
          <span className="text-faint">
            {a.name} attacks left, {b.name} attacks right.
            {left === null || right === null
              ? ` No role recorded for ${left === null ? a.name : b.name}.`
              : ""}
          </span>
        </figcaption>
      </figure>
    </Section>
  );
}

/** One marker. A ring in the plate's own ink around it, because a club colour
 *  dropped on turf can be any lightness and several are close to it — `inkOn`
 *  is the app's answer to that everywhere else and it is the answer here. */
function Dot({
  x,
  y,
  fill,
  diamond = false,
}: {
  x: number;
  y: number;
  fill: string;
  diamond?: boolean;
}) {
  // The pitch is 100x64 and a spot is in percent of each axis.
  const cy = (y / 100) * 64;
  const stroke = inkOn({ primary: fill, secondary: fill });

  return diamond ? (
    <rect
      x={x - 2.2}
      y={cy - 2.2}
      width="4.4"
      height="4.4"
      transform={`rotate(45 ${x} ${cy})`}
      fill={fill}
      stroke={stroke}
      strokeWidth="0.5"
    />
  ) : (
    <circle cx={x} cy={cy} r="2.6" fill={fill} stroke={stroke} strokeWidth="0.5" />
  );
}

/** His mark and his name, in the legend rather than on the turf. */
function Key({ name, fill, diamond = false }: { name: string; fill: string; diamond?: boolean }) {
  return (
    <span className="flex items-center gap-1 font-bold">
      <span
        aria-hidden
        className={`inline-block h-2.5 w-2.5 shrink-0 ${diamond ? "rotate-45" : "rounded-full"}`}
        style={{ background: fill, outline: `1px solid ${inkOn({ primary: fill, secondary: fill })}` }}
      />
      {name}
    </span>
  );
}
