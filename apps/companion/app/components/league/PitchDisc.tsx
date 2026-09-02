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
import { fixtureLabel } from "@epl/core";

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
  outline = "var(--color-chrome)",
}: {
  rostered: RosteredPlayer;
  club: Club | undefined;
  opposition?: Opposition[];
  /** What our league scores him this period. Undefined is no table at all,
   *  null a table that does not name him. */
  points?: number | null;
  /** What the plate under his name carries. */
  show?: "points" | "fixture";
  /** The RING round the disc — the fantasy team's secondary colour (Craig,
   *  2 Sep). The fill stays chrome, which is what `19.jpg` draws and what
   *  `teamColours.ts` requires: a team's colour identifies a side in a
   *  confrontation, and a ring is a trim rather than an identity. It reads as
   *  one squad's eleven without claiming to be the team's own plate.
   *
   *  Defaults to the chrome itself, so a caller that has no team — the
   *  head-to-head, which draws two sides and settles them another way — gets
   *  the plain disc rather than a fallback colour pretending to be somebody's. */
  outline?: string;
}) {
  const resolved = isResolved(rostered) ? rostered : null;
  const started = kickedOff(opposition);

  return (
    <div className="relative flex w-full flex-col items-center">
      {/* **A circle with his face filling it, and the circle is CHROME.**

          · One colour for all eleven, because eleven club colours turned the
            pitch into eleven separate badges. That much of the first cut was
            right, and it is what `19.jpg` does.
          · But the colour is the chrome blue, NOT the fantasy team's.
            `teamColours.ts` says in its own docblock where a team's colour may
            appear — "the team's own title bar and each side of a head-to-head,
            and nowhere else" — because the colour's one job is telling two sides
            of a confrontation apart, and a squad screen has one side. CM agrees:
            its discs are the same blue as the title bar and the rail, which is
            furniture rather than identity. Ours were also failing at the job —
            most of the table ringed the turf at under 2:1.
          · The whole head fits the circle. `PlayerImage` crops `object-top`
            because it normally stands on grass with its feet cut off; inside a
            disc that cropped the chin instead, so a disc asks for `contain`.
          · Smaller. The circle was 64px against a name at 10 — it dominated the
            row and pushed the lines apart.

          `--row-portrait` is the size `PlayerImage` reads, so it is set here and
          the image sizes itself off it. */}
      <span
        className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full border bg-chrome"
        style={
          {
            // The ring is the team's; the fill stays chrome.
            borderColor: outline,
            // **The portrait fills the circle** (Craig, 2 Sep, after I had
            // three goes at it: "YOU are cutting the players off at the bottom
            // 25%, the players should just fill the entire circle").
            //
            // He is right and the fault was mine at every attempt: I kept
            // pinning the image to the TOP and then arguing about how far to
            // zoom, which by construction pushes the bottom quarter out of the
            // frame. `object-cover` on its own already fills a box and crops
            // the overflow evenly — the source is 220x280, so in a square disc
            // it trims a little from top and bottom and keeps the middle, which
            // is where a head-and-shoulders portrait keeps its head.
            //
            // A touch of zoom so he fills the disc rather than sitting in it,
            // and the frame pushed DOWN so the crown stays inside the ring as he
            // grows (Craig, 2 Sep: "zoom in… like 1.10", then another
            // 5% on top of it).
            // `origin-top` is what makes the pair work: the image grows
            // downward from its top edge rather than outward from its middle.
            "--pitch-crop": "12%",
            "--pitch-zoom": "1.15",
          } as CSSProperties
        }
      >
        {resolved === null ? (
          /* `text-cream` on the chrome plate, which is a pair DESIGN has
             measured. It was `text-bg` over the team's `secondary`, and for the
             two teams whose secondary is near-black that came out at 1.1:1 —
             an invisible letter, and a hard AA failure `register-warden`
             caught. A plate owns its ink (§2). */
          <span className="grid h-full w-full place-items-center font-display text-3xs font-bold uppercase text-cream">
            {rostered.slot.position || "?"}
          </span>
        ) : (
          <PlayerImage
            player={resolved.player}
            club={club}
            keeper={rostered.slot.position === "G"}
            kickedOff
            fill
            sizes="56px"
          />
        )}
      </span>

      {/* **White, on the grass, with no plate under it.** The plate went in when
          white-at-nine-pixels over a BRIGHT green was unreadable; the turf is
          CM's dark green now and white measures 11.58:1 on it, so the plate
          solves a problem that no longer exists — and a row of black bars is
          what made this read as cards on grass rather than as a team.

          **Not yellow, and `19.jpg` is why.** A comment here claimed CM sets its
          names in yellow and `register-warden` checked the image: the names on
          that tactics pitch are WHITE, and the only yellow on the screen is the
          shape heading, the selection box, the pressed tab and the rail's
          current entry — every one of them a selection or a state, which is
          exactly what `--color-accent` means in DESIGN §3. Spending the accent
          on a bare identifier would have made "yours" the colour of eleven names
          on nine other managers' squads, on a screen that now opens on a rival's
          by default. */}
      <span className="w-full truncate px-0.5 text-center font-display text-2xs font-bold uppercase leading-none text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.95)]">
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
