import type { SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import { SCROLL, SMALL_CAPS } from "@/app/desk";
import SquadRow from "./SquadRow";

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
  bare = false,
  head = true,
  reserve = false,
  figure,
}: {
  lines: SquadDetailLine[];
  /** Skip the panel, because a caller has already drawn one round this AND
   *  whatever stands beside it.
   *
   *  The default draws its own for `groundfit`'s reason below, and that must not
   *  be removed — this is the narrow case where a second one would nest a box in
   *  a box. `squad/[teamId]/Sheet` sets it so the list and the pitch share a
   *  single box, which is what `/prem/club/[code]` does and what Craig asked
   *  this to copy (3 Sep 2026). */
  bare?: boolean;
  /** Whether the points are Fantrax's projection rather than a season played.
   *  The heading says which, because the numbers cannot. */
  projected: boolean;
  /** What the figure column is a figure OF, when it is neither of the two above.
   *
   *  **Provenance at the point of use** (DESIGN §7). The planner opens on the
   *  round a manager can still change, which by definition has no football in
   *  it — so a column headed `FPts` was fifteen dashes, and a reader takes that
   *  for broken data rather than for an empty week. It shows his season instead
   *  and says so; the moment the round starts scoring the caller hands back the
   *  live numbers and the heading with them. */
  figure?: string;
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
  /** Whether to draw the column heads.
   *
   *  **The bench is the caller that says no** (Craig, 11 Sep 2026: "we probably
   *  dont need a 2nd Pos / Player / Opponent / FPts for the bench"). A squad in
   *  list view is two of these — the eleven, then the reserves under a "Bench"
   *  plate — and each drew its own header, so a phone carried the same four words
   *  twice inside 400px. The plate between them already names the second group;
   *  a header under a heading is the heading said again in smaller type. */
  head?: boolean;
  /** These rows are the BENCH (Craig, 21 Sep 2026: "bench players should be
   *  greyed out too). Championship Manager greys everyone not in the side, and
   *  the eleven above is the statement the grey is measured against. */
  reserve?: boolean;
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
    <div className={bare ? SCROLL : `cm-panel ${SCROLL}`}>
      <div className="flex flex-col lg:min-w-max">
        {/* One bevelled strip over the whole squad, the way a CM table is headed —
          rather than a small-caps label per position group, which made five
          headings and no columns. The group bars below separate; this names. */}
        {head ? (
        <div className={`cm-bevel flex min-h-7 items-center gap-1.5 px-1.5 ${SMALL_CAPS}`}>
          <span className="w-10 shrink-0">Pos</span>
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
          <span className="min-w-0 flex-[1_1_5rem]">Player</span>

          {/* Who his CLUB plays this week — the football fixture, not ours. */}
          <span className="w-[5.5rem] shrink-0">Opponent</span>
          {/* **Points, and only points** (Craig, 2 Sep: "FPts is first row,
              maybe just that stat only", then "FPts at the right hand side").
              The eight per-match stat columns came off with that: they answered
              the same question at more length, and the Stats tab now answers it
              properly, with a filter over every category. What is left is the
              one figure a manager scans a squad FOR, in the last column — which
              is where `cm9900/12.jpg` puts its own, Value hard against the right
              edge with the readings before it. */}
          {scored ? (
            <span className="w-9 shrink-0 text-right">
              {figure ?? (projected ? "Proj" : "FPts")}
            </span>
          ) : null}
        </div>
        ) : null}

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
                <SquadRow
                  player={player}
                  eligible={eligibility?.[player.rostered.slot.fantraxId]}
                  onOpen={onOpen && (() => onOpen(player))}
                  reserve={reserve}
                />
              </li>
            )),
          )}
        </ul>
      </div>
    </div>
  );
}
