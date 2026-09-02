import type { CSSProperties } from "react";
import {
  type Club,
  type Opposition,
  type RosteredPlayer,
  isResolved,
  kickedOff,
  pitchName,
} from "@epl/core";
import PlayerImage from "./PlayerImage";
import { type TeamColours, fixtureLabel } from "@epl/core";

// One player on Championship Manager's pitch: a head, a name, and what he is
// worth. The marker half of the `CmGround` trial.
//
// **A cut-out head where CM had a numbered disc** (Craig, 31 Aug — "numbered
// discs aren't ideal for us… let's trial player cut out"). We have no number to
// draw: FPL's `squad_number` is a key that is null on all 622 elements, which
// `CLAUDE.md` records as a fact rather than a gap. A face is what we do have,
// and `PlayerPortrait` already draws one as a disc — the club's colour behind
// it, his initials when the photograph 403s, and the whole fallback ladder that
// took a day to get right. It sizes off `--row-portrait`, so this sets that and
// nothing else.
//
// **The name stays, unlike CM's.** The game gets away with bare numbers because
// the squad list stands beside the pitch carrying the same numbers; ours is a
// toggle, so a nameless pitch would be fifteen strangers. On a cream plate and
// not on the grass: white type at nine pixels over grass was tried and is
// recorded as unreadable.
//
// **The fixture stays too** (Craig, same message): the coloured box is handy
// here, where a manager is picking a side and the card has room for it. It came
// off the list in the same change.
//
// **The disc is chrome and never the club's colour** (Craig, 31 Aug: "colour
// scheme doesn't work does it? With the circles"). It was `colours.primary`
// first, which put twenty brand palettes on a green field in a register where
// every colour is a slot — the exact thing `PhotoGround` greyscales a photograph
// to avoid, and the exact thing `PitchPlayer` had already removed when it
// dropped the sticker's backing for "nothing behind them at all". CM's own pitch
// is four colours. The club still reads, out of the photograph rather than out
// of the palette, which is where a kit belongs.

export default function PitchDisc({
  rostered,
  club,
  opposition,
  points,
  show = "points",
  team,
}: {
  rostered: RosteredPlayer;
  club: Club | undefined;
  opposition?: Opposition[];
  /** What our league scores him this period. Undefined is no table at all,
   *  null a table that does not name him. */
  points?: number | null;
  /** What the plate under his name carries. */
  show?: "points" | "fixture";
  /** The FANTASY team's colours — the disc's ring and fill. One colour for the
   *  whole eleven, which is what makes them read as a side. */
  team: TeamColours;
}) {
  const resolved = isResolved(rostered) ? rostered : null;
  const started = kickedOff(opposition);

  return (
    <div className="relative flex w-full flex-col items-center">
      {/* **The arrow, above the man who is going forward** — which is how the
          shot draws it and, more to the point, is the only mark on CM's pitch
          that says anything about intent. Ours is derived from the shape rather
          than from an instruction, because Fantrax sells a roster slot and no
          tactic; `join/tactics.ts` carries the rule and the reasoning.

          `aria-hidden`, and the instruction is not otherwise announced: it is a
          restatement of the formation printed in words above the pitch, so a
          reader who cannot see it has already been told. */}
      {/* **A circle in the TEAM's colour, with his face filling it** (Craig,
          2 Sep). Three corrections to the first cut, all from the shot:

          · The ground is the FANTASY team's colour, not the football club's.
            The pitch is a picture of one manager's side, so eleven different
            club colours turned it into eleven separate badges — CM's discs are
            all one colour for exactly that reason, and the colour is the team's.
          · The face fills the circle. `PlayerImage` crops `object-top` because
            it normally stands on grass with its feet cut off; inside a disc that
            put the head against the ceiling with a chin at the bottom edge.
            `object-cover` centred on the face is what a round crop wants.
          · Smaller. The circle was 64px against a name at 10 — it dominated the
            row and pushed the lines apart.

          `--row-portrait` is the size `PlayerImage` reads, so it is set here and
          the image sizes itself off it. */}
      <span
        className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 lg:h-14 lg:w-14"
        style={
          {
            borderColor: team.primary,
            backgroundColor: team.secondary,
            // Pull the crop down a touch: a portrait's head sits in the upper
            // third of the frame, so dead centre puts it high in a circle.
            "--pitch-crop": "22%",
          } as CSSProperties
        }
      >
        {resolved === null ? (
          <span className="grid h-full w-full place-items-center font-display text-3xs font-bold uppercase text-bg">
            {rostered.slot.position || "?"}
          </span>
        ) : (
          <PlayerImage
            player={resolved.player}
            club={club}
            keeper={rostered.slot.position === "G"}
            kickedOff
            sizes="56px"
          />
        )}
      </span>

      {/* **Yellow, on the grass, with no plate under it** — which is exactly
          how the AC Milan shot sets a name, and the last thing between ours and
          it (Craig, 2 Sep: "compared the two, ours is just not good enough
          yet"). The plate went in when white-at-nine-pixels over a BRIGHT green
          was found unreadable; the turf is CM's dark green now, and yellow on it
          measures well clear — so the plate is solving a problem that no longer
          exists, and a row of black bars is what made our pitch read as cards on
          grass rather than as a team on a pitch.

          `--color-accent` is the token, and this is one of the few places the
          slot's meaning bends: on a pitch a name in yellow is CM's own
          convention for a player, not a claim that he is "yours". The shadow is
          what carries it over the mown stripes. */}
      <span className="w-full truncate px-0.5 text-center font-display text-2xs font-bold uppercase leading-none text-accent [text-shadow:0_1px_3px_rgb(0_0_0/0.95)]">
        {pitchName(rostered)}
      </span>

      {/* **What he is worth, or who he plays** — and which of the two is the
          caller's to say. The squad screen wants the FIXTURE (Craig, 2 Sep:
          "pitch view on squad page does not need points, just the next fixture
          I guess"), because a squad is about the week ahead; the head-to-head
          wants the points, because that screen is about a score. CM's own
          tactics pitch carries neither — its discs hold a shirt NUMBER — so
          there is no reference answer and this follows the question each screen
          is asking. */}
      <span className="numeric w-full truncate px-0.5 text-center text-3xs font-bold leading-none text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.95)]">
        {show === "fixture"
          ? (fixtureLabel(opposition) ?? club?.shortName ?? "—")
          : started
            ? (points ?? "—")
            : (club?.shortName ?? "—")}
      </span>
    </div>
  );
}
