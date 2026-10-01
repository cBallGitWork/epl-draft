import type { CSSProperties } from "react";
import {
  type Club,
  type DoubtBand,
  type FootballPlayer,
  type Opposition,
  availabilityOf,
  doubtBand,
  fixtureLabel,
  kickedOff,
  DASH,
} from "@epl/core";
import EmptySlot from "./EmptySlot";
import PlayerImage from "./PlayerImage";
import PlayerShirt from "./PlayerShirt";
import { NAME_SIZE, PITCH_BAND } from "./PitchRows";

// One player on CM's pitch: his kit (or, where the caller asks, his face), his name on CM's bevelled plate, and a
// line under it — his score, his fixture, or the caller's own word. The marker half of the `CmGround` pair.

/** The doubt grounds written out: Tailwind v4 drops a token whose name is composed, as `var(--color-doubt-${band})` would be. */
const DOUBT_GROUND: Record<DoubtBand, string> = {
  out: "var(--color-doubt-out)",
  major: "var(--color-doubt-major)",
  slight: "var(--color-doubt-slight)",
};

export default function PitchMarker({
  player,
  label,
  name,
  keeper,
  club,
  opposition,
  points,
  show = "points",
  band,
  face,
}: {
  /** The footballer, or null for a slot with nobody behind it — read to tell the two apart and for his doubt. */
  player: FootballPlayer | null;
  /** What an empty slot says — a position, a "?" — in the caller's words. */
  label: string;
  /** His name as the caller spells it; the two layers disagree. */
  name: string;
  /** Whether he keeps goal, which picks the kit. */
  keeper: boolean;
  club: Club | undefined;
  opposition?: Opposition[];
  /** His score: undefined is no table at all, null a table that does not name him. */
  points?: number | null;
  /** What the line under his name carries. */
  show?: "points" | "fixture";
  /** A line of the caller's own, which wins over `show` — a club's predicted eleven puts our league's position here. */
  band?: string;
  /** His face instead of the club's kit, falling back to the kit where there is no photograph. */
  face?: { code: number; name: string };
}) {
  const started = kickedOff(opposition);
  // Nobody at all: no man AND no club. A named man the bootstrap lacks still has his club's kit.
  const nobody = player === null && club === undefined;

  // `v` before an opponent, or three letters under a shirt read as his own club (Craig, 21 Sep 2026).
  const against = fixtureLabel(opposition);
  const line =
    band ??
    (show === "fixture"
      ? (against === null ? (club?.shortName ?? DASH) : `v ${against}`)
      : started
        ? String(points ?? DASH)
        : (club?.shortName ?? DASH));

  // How likely he is to miss, as the name plate's ground (red out, orange major, yellow slight); `--cm-face`
  // keeps it CM's bevelled plate, and all three carry `--color-bg` ink.
  const doubt = doubtBand(availabilityOf(player));

  return (
    // A 45% wash behind the card, no border and no padding: the mow bands show through and the name keeps the width.
    <div
      // The space before `${` is load-bearing: Tailwind v4 does not see `bg-bg/45${…}` as a class and drops the wash.
      className={`flex w-full flex-col gap-px bg-bg/45 ${doubt === "out" ? "cm-card-out" : ""}`}
    >
      {nobody ? (
        /* The same shape as a filled card, so an empty slot does not read as a hole in the formation. */
        <EmptySlot label={label} />
      ) : (
        <span className="block px-1 pt-0.5">
          {face === undefined ? (
            <PlayerShirt club={club} keeper={keeper} name={name} kickedOff={started} />
          ) : (
            <PlayerImage player={face} club={club} keeper={keeper} kickedOff={started} sizes="110px" />
          )}
        </span>
      )}

      {/* CM's bevelled plate, run to the card's edge so every pixel goes to letters; the kit is what is inset. */}
      <span
        className={`cm-bevel uppercase ${PITCH_BAND} ${NAME_SIZE}`}
        style={
          doubt === null
            ? undefined
            : ({ "--cm-face": DOUBT_GROUND[doubt] } as CSSProperties)
        }
      >
        <span className="w-full truncate">{name}</span>
      </span>

      {/* Absent rather than empty when the caller has nothing to say here. */}
      {line === "" ? null : (
        <span
          // A score or a fixture is read at arm's length; a caller's own word is a label and stays small.
          className={`numeric ${band === undefined ? "text-xs" : "text-3xs"} ${PITCH_BAND}`}
          style={{ background: "var(--color-bg)", color: "var(--color-cream)" }}
        >
          <span className="w-full truncate">{line}</span>
        </span>
      )}
    </div>
  );
}
