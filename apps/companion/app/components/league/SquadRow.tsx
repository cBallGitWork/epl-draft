import Image from "next/image";
import {
  type SquadPlayerDetail,
  crestUrl,
  fixtureLabel,
  isResolved,
  fullPlayerName,
  DASH,
} from "@epl/core";
import StateBox from "../football/StateBox";
import { doubtRow } from "../football/doubtRow";
import PositionTile from "./PositionTile";
import { ROW_NAME } from "@/app/desk";

// One man's row in a squad list: our position, his club's crest, his name, his fixture and his figure.

export default function SquadRow({
  player,
  eligible,
  onOpen,
  reserve,
}: {
  player: SquadPlayerDetail;
  eligible: string[] | undefined;
  onOpen?: () => void;
  reserve: boolean;
}) {
  const { club, points } = player;
  const resolved = isResolved(player.rostered) ? player.rostered : null;
  // Null for a slot the bridge has not settled, which is ordinary — the pool
  // carries academy names FPL has never listed — and reads as silence.
  const footballer = resolved?.player ?? null;

  // Who his club plays, in the app's one spelling of a fixture — `BRE (H)`.
  const fixture = fixtureLabel(player.opposition);

  // One line, not two. Stacking his club under his name doubled the height of a
  // fifteen-row list to carry two short strings that sit happily beside each
  // other.
  const inside = (
    <>
      {/* **Position, then the crest, then the name** (Craig, 21 Sep 2026: "for
          the list view, we should put our position in the blue chip (same code),
          then the team logo, then player name, more CM style"). `cm9900/24.jpg`
          opens every row with the blue index block and the reference he sent
          opens each of its own with the squad number in one; ours holds the
          position because FPL's `squad_number` is a key present on all 622
          elements and null on every one of them, so there is no number to put
          there and the position is the fact a manager scans this column for.

          It was amber type on the bare row until now — the one identifying mark
          on the line that was not a plate, in the slot `--color-mid` reserves for
          a figure standing beside a name. */}
      <PositionTile
        positions={eligible && eligible.length > 0 ? eligible : [player.rostered.slot.position ?? ""]}
      />

      {/* **The club crest, not his face** (Craig, 2 Sep: "team logo in the squad
          list I think, it's too small for portraits). A portrait went in here
          first and he is right about why it had to come out: `.cm-row` is 28px
          above `lg`, so the mark is 20px square, and a cut-out head at 20px is a
          smudge — while a crest is a flat two-colour shape drawn to be read at
          exactly that size. The reference agrees by omission: `cm9900/12.jpg`
          and `25.jpg` carry no faces at all, because CM's squad list is 18px
          rows and a face cannot live in one.

          The portrait keeps the screens where it has room — the pitch, the
          profile masthead, the player card. */}
      {/* **No tile behind the crest** (Craig, 2 Sep: "logos can remove
          background"). A Premier League badge is drawn to stand on its own —
          it carries its own shape and its own colours — and a club-coloured
          square behind it was a second statement of the same fact, competing
          with the badge it was meant to support. `cm9900/24.jpg` sets its club
          names on the bare row; nothing in the reference puts a plate behind an
          identifying mark. */}
      <span className="grid h-7 w-7 shrink-0 place-items-center">
        {club ? (
          /* Sized in both axes. `h-full` resolves to auto against an
             auto-sized grid row, so only the width bound applied and a 150:112
             crest rendered 20 x 26.8 inside a 20 x 20 box — overhanging the
             coloured tile above and below on every row. */
          <Image
            src={crestUrl(club)}
            alt=""
            width={22}
            height={22}
            className="h-6 w-6 object-contain"
          />
        ) : (
          <span
            aria-hidden
            className="numeric text-[0.5rem] font-bold text-white/70"
          >
            ?
          </span>
        )}
      </span>

      {/* `ROW_NAME` and not a size of its own (Craig, 7 Sep 2026). This was
          `text-sm font-medium` in the UI face — the one row in the app a manager
          reads fifteen of at a time, set lighter and in a different family from
          every other name in a list. The `flex-` is the caller's, because what
          gives way when the fixed columns outgrow the row is this screen's
          decision and not the recipe's. */}
      {/* Why he is not playing, right after his name (Craig, 30 Sep 2026); silent for a fit man. */}
      <span className="flex min-w-0 flex-[1_1_5rem] items-center gap-1.5">
        <span className={`min-w-0 truncate ${ROW_NAME}`}>{fullPlayerName(player.rostered)}</span>
        <StateBox player={footballer} />
      </span>

      {/* His club's fixture this week. Craig asked for it and the reference does
          not forbid it: `12.jpg` carries no opponent because it is a TRAINING
          screen, and a fantasy manager's question — is my defender at home to a
          side that concedes — is not one Championship Manager's own squad had to
          answer. Club then opponent, so the eye reads "ARS v LIV" as one fact. */}
      {/* `fixtureLabel` already names the club he plays, so his own club is not
          repeated beside it — "ARS  BRE (H)" reads as two clubs with no
          relation. An unmapped slot has no fixture to show and says so. */}
      <span className="numeric w-[5.5rem] shrink-0 truncate text-xs text-muted">
        {fixture ?? <span className="text-faint">unmapped</span>}
      </span>

      {/* Undefined is no table at all and takes the cell with it; null is a
          table that does not name him, which is a dash.

          `text-sm`, which is §6's figure-in-a-row at both widths. It went to
          `text-base` on 11 Sep 2026 for "fonts could be bigger on list" and came
          back: §6 gates that step behind a screen "able to say the same thing
          about itself" — that its only content is names and their figures — and
          this list is also the four-column gated board on `/squad/[teamId]`.
          What DID move is the three cells that were BELOW the recipe: the head
          strip, the position and the opponent. */}
      {points === undefined ? null : (
        <span className="numeric w-9 shrink-0 text-right text-sm font-bold text-accent">
          {points ?? DASH}
        </span>
      )}
    </>
  );


  // `min-h-11` and not the `min-h-9` this carried until 31 Aug 2026: fifteen of
  // these are buttons, and a list of fifteen tappable rows on a phone is exactly
  // the case the 44px floor exists for. It was a second undocumented exception
  // beside the view toggle's, found by `tools/ui/tapfit.mjs`. `.cm-row` takes it
  // back to 28 above `lg`, where there is no thumb.
  //
  // `cm-out` is the grey CM puts on everyone not in the side. It is a colour
  // rule and the wash is a ground, so a greyed reserve who is also injured keeps
  // both statements.
  const shell = [
    "cm-row flex min-h-11 w-full items-center gap-1.5 px-1.5 text-left",
    reserve ? "cm-out" : "",
    doubtRow(footballer),
  ]
    .filter(Boolean)
    .join(" ");

  return onOpen ? (
    <button
      type="button"
      onClick={onOpen}
      className={`${shell} hover:bg-raised`}
    >
      {inside}
    </button>
  ) : (
    <div className={shell}>{inside}</div>
  );
}
