import Image from "next/image";
import {
  type SquadDetailLine,
  type SquadPlayerDetail,
  crestUrl,
  fixtureLabel,
  isResolved,
  fullPlayerName,
} from "@epl/core";
import StateBox from "../football/StateBox";
import { positionsLabel } from "../../positions";

// The same fifteen as a list. Offered beside the pitch rather than instead of
// it: the pitch answers "what does this squad look like" and a list answers "who
// exactly is in it", and a manager checking whether a rival holds a particular
// player is asking the second one.
//
// The crest leads the row because a column of names is a column of names. It is
// also the one identifying mark we always have — a portrait is missing for weeks
// for a January signing, and the club never is.
//
// **Position is a column, not a heading over a group** (Craig, 2 Sep). The group
// bars had to file a man under one letter, and 48 of 607 in this pool hold two —
// Saka is `F,M`. `cm9900/12.jpg` settles it: CM runs `Position` as a column
// carrying `D/DM LC` and `AM/F C`, because eligibility is a fact about a player
// and a heading cannot hold two of them.
//
// Spelling the letters out is a documented exception to "never translate
// Fantrax's vocabulary" (CLAUDE.md, CODE_RULES §3): `getLeagueInfo` publishes
// the letters and nothing else — probed 19 Aug — so a readable label can only
// come from us. The rule survives in the fallback: a letter `positions.ts` has
// never seen is printed verbatim, so a commissioner who files wingers under `W`
// gets `W` rather than a guess.

export default function SquadRows({
  lines,
  projected,
  onOpen,
  eligibility,
}: {
  lines: SquadDetailLine[];
  /** Whether the points are Fantrax's projection rather than a season played.
   *  The heading says which, because the numbers cannot. */
  projected: boolean;
  /** Absent on the head-to-head board, which has no player card to open. A row
   *  that looked like a button and did nothing is worse than a row. */
  onOpen?: (player: SquadPlayerDetail) => void;
  /** Every man's eligible positions, by Fantrax id — his manager's ROSTER slot
   *  is what scores him and this is what he is allowed to be, which are two
   *  different facts and the column wants the second. Absent when the caller
   *  cannot read `getLeagueInfo`, and then the column simply prints his slot.
   *
   *  **A record and not a `Map`**, because both callers are client components:
   *  `unstable_cache` and the server/client boundary both round-trip through
   *  JSON, and a `Map` arrives as `{}` with no `.get` — the exact failure
   *  `playerStats.ts` records having hit once already. */
  eligibility?: Record<string, string[]>;
}) {
  const scored = lines.some((line) =>
    line.players.some((p) => p.points !== undefined),
  );

  return (
    // **Scrolls sideways above `lg`, and it has to.** The eight stat columns
    // appear there at 56px each, so the row's fixed width is about 670px before
    // the name gets a pixel — and since 31 Aug the list shares the screen with
    // the season grid, which leaves it 554. It fitted while it had the whole
    // frame; halving the column is what found this. A dense table that does not
    // fit scrolls inside its panel, which is what the season grid does and what
    // CM's own tables did. `min-w-max` only above `lg`: on a phone the stat
    // columns are hidden and the name truncates into whatever is left, which is
    // right there and would become a sideways scroll if this applied.
    // **A panel, so the rows are on a ground rather than on the photograph**
    // (Craig, 2 Sep: "the list view on the left needs the darkened table behind
    // it, it's hard to read"). This is the desk's own rule stated in DESIGN §2 —
    // nothing prints text on the bare ground — and the list had been the one
    // dense table in the app breaking it, because it was drawn bare wherever it
    // was placed. `cm9900/12.jpg` has its whole table inside a sunken well and
    // lets the picture show between panels, never through one.
    <div className="cm-panel overflow-x-auto">
      <div className="flex flex-col lg:min-w-max">
        {/* One bevelled strip over the whole squad, the way a CM table is headed —
          rather than a small-caps label per position group, which made five
          headings and no columns. The group bars below separate; this names. */}
        <div className="cm-bevel flex min-h-7 items-center gap-1.5 px-1.5 text-3xs font-bold uppercase">
          <span className="w-7 shrink-0" />
          {/* **`min-w-0 flex-1` and a basis, not a min-width.** The name column
              is the only elastic one on the row, so it is what gives way when
              the fixed columns outgrow the track — and at 390 with a position
              and an opponent added it gave way to NOTHING: every name rendered
              0px wide under a header printed on top of the next one. A basis
              holds a floor at both widths and lets the row scroll instead. */}
          {/* **Position is a COLUMN, not a bar over a group** (Craig, 2 Sep:
              "dont use grey bars for positions, we have players who can play
              multiple positions"). He is right and the reference is with him:
              `cm9900/12.jpg` runs `Position` as a column carrying `D/DM LC` and
              `AM/F C`, because a man eligible at two cannot live under one
              heading. Grouping him under a single letter is a claim the data
              does not support — Saka is `F,M` and 48 of 607 are like him. */}
          <span className="w-9 shrink-0">Pos</span>
          <span className="min-w-0 flex-[1_1_5rem]">Player</span>

          {/* Who his CLUB plays this week — the football fixture, not ours. */}
          <span className="w-[4.75rem] shrink-0">Opponent</span>
          {/* **Points, and only points** (Craig, 2 Sep: "FPts is first row,
              maybe just that stat only", then "FPts at the right hand side").
              The eight per-match stat columns came off with that: they answered
              the same question at more length, and the Stats tab now answers it
              properly, with a filter over every category. What is left is the
              one figure a manager scans a squad FOR, in the last column — which
              is where `cm9900/12.jpg` puts its own, Value hard against the right
              edge with the readings before it. */}
          {scored ? (
            <span className="w-9 shrink-0 text-right">{projected ? "Proj" : "FPts"}</span>
          ) : null}
        </div>

        {/* **One list, no group bars.** The position now rides each row as a
            column, so the separators had nothing left to separate — and a man
            eligible at two positions was being filed under one of them, which
            is the thing the column exists to stop. `cm9900/12.jpg` is a single
            unbroken run of players with `Position` among its columns; the lines
            still arrive grouped from the join, and flattening them here keeps
            the order (keepers first, then out by depth) without printing the
            grouping as furniture. */}
        <ul className="cm-rows flex flex-col">
          {lines.flatMap((line) =>
            line.players.map((player) => (
              <li key={player.rostered.slot.fantraxId}>
                <Row
                  player={player}
                  eligible={eligibility?.[player.rostered.slot.fantraxId]}
                  onOpen={onOpen && (() => onOpen(player))}
                />
              </li>
            )),
          )}
        </ul>
      </div>
    </div>
  );
}

function Row({
  player,
  eligible,
  onOpen,
}: {
  player: SquadPlayerDetail;
  eligible: string[] | undefined;
  onOpen?: () => void;
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

      {/* `lg:min-w-32` is load-bearing: `flex-1 min-w-0` gives way first when the
          fixed columns outgrow the row, and what gave way was the one thing on
          the line a reader cannot infer. Measured at 1440 in a 554px column on
          31 Aug: every name was **0px wide**. */}
      {/* What he is ELIGIBLE at, which is not the slot he is filling. Yellow
          because `cm9900/25.jpg` sets the eligibility strings in yellow beside
          each name — and because our own palette spends amber on a figure and
          this is closer to one than to prose. Falls back to his slot when the
          league would not say. */}
      <span className="w-9 shrink-0 truncate text-3xs font-bold text-mid">
        {(eligible && eligible.length > 0
          ? positionsLabel(eligible)
          : positionsLabel([player.rostered.slot.position ?? ""])) ?? "—"}
      </span>

      <span className="min-w-0 flex-[1_1_5rem] truncate text-sm font-medium">
        {fullPlayerName(player.rostered)}
      </span>

      {/* Why he is not playing, in the place CM put it: beside the name, before
          anything numeric. Silent for a fit man. */}
      <StateBox player={footballer} />



      {/* His club's fixture this week. Craig asked for it and the reference does
          not forbid it: `12.jpg` carries no opponent because it is a TRAINING
          screen, and a fantasy manager's question — is my defender at home to a
          side that concedes — is not one Championship Manager's own squad had to
          answer. Club then opponent, so the eye reads "ARS v LIV" as one fact. */}
      {/* `fixtureLabel` already names the club he plays, so his own club is not
          repeated beside it — "ARS  BRE (H)" reads as two clubs with no
          relation. An unmapped slot has no fixture to show and says so. */}
      <span className="numeric w-[4.75rem] shrink-0 truncate text-3xs text-muted">
        {fixture ?? <span className="text-faint">unmapped</span>}
      </span>

      {/* Undefined is no table at all and takes the cell with it; null is a
          table that does not name him, which is a dash. */}
      {points === undefined ? null : (
        <span className="numeric w-9 shrink-0 text-right text-sm font-bold text-accent">
          {points ?? "—"}
        </span>
      )}
    </>
  );

  // `min-h-11` and not the `min-h-9` this carried until 31 Aug 2026: fifteen of
  // these are buttons, and a list of fifteen tappable rows on a phone is exactly
  // the case the 44px floor exists for. It was a second undocumented exception
  // beside the view toggle's, found by `tools/ui/tapfit.mjs`. `.cm-row` takes it
  // back to 28 above `lg`, where there is no thumb.
  const shell =
    "cm-row flex min-h-11 w-full items-center gap-1.5 px-1.5 text-left";

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
