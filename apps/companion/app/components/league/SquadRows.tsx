import Image from "next/image";
import {
  type SquadDetailLine,
  type SquadPlayerDetail,
  clubColours,
  contribution,
  crestUrl,
  isResolved,
  kickedOff,
  playerName,
} from "@epl/core";
import StateBox from "../football/StateBox";
import type { Contribution } from "@epl/core";
import { chipsFor } from "./Chips";
import { positionGroup } from "../../positions";

// The same fifteen as a list. Offered beside the pitch rather than instead of
// it: the pitch answers "what does this squad look like" and a list answers "who
// exactly is in it", and a manager checking whether a rival holds a particular
// player is asking the second one.
//
// The crest leads the row because a column of names is a column of names. It is
// also the one identifying mark we always have — a portrait is missing for weeks
// for a January signing, and the club never is.
//
// The position heading spells the letter out, and that is a documented exception
// to "never translate Fantrax's vocabulary" (CLAUDE.md, CODE_RULES §3).
// `getLeagueInfo` publishes the letters and nothing else — probed 19 Aug, there
// is no long name anywhere in the payload — so a readable heading can only come
// from us. The rule survives in the fallback: a letter this map has never seen
// is printed verbatim, so a commissioner who files wingers under W gets "W" in
// the place the pitch would put it, not a guess.

/** Fantrax allows a roster slot with no position at all, and `squadUnarranged`
 *  carries it rather than dropping the player. It arrives here as an empty
 *  string, which would print as a heading that is not there. */
const UNPLACED = "No position";

/** The stat columns, in one place because the head strip and the rows both print
 *  them — the fault this file already carries a comment about, where the heads
 *  said W-L-T after the cells had stopped.
 *
 *  Every value is on `contribution()`, which the row already computes. None of
 *  this costs a request: it is the same `PlayerMatchStats[]` the pitch reads to
 *  draw a chip, and the list was throwing it away after two chips.
 *
 *  `measured` is null before FPL publishes the round's advanced stats, and those
 *  four columns read a dash rather than a nought — a nought is a claim that he
 *  did nothing, and absence is not that. */
const STATS: readonly {
  key: string;
  head: string;
  title: string;
  of: (done: Contribution) => number | null;
}[] = [
  { key: "min", head: "Min", title: "Minutes played", of: (d) => d.minutes },
  { key: "g", head: "G", title: "Goals", of: (d) => d.goals },
  { key: "a", head: "A", title: "Assists", of: (d) => d.assists },
  {
    key: "cs",
    head: "CS",
    title: "Clean sheet",
    of: (d) => (d.cleanSheet ? 1 : 0),
  },
  { key: "sv", head: "Sv", title: "Saves", of: (d) => d.saves },
  {
    key: "bps",
    head: "BPS",
    title: "FPL's bonus points system score",
    of: (d) => d.measured?.bps ?? null,
  },
  {
    key: "xg",
    head: "xG",
    title: "Expected goals — FPL's",
    of: (d) => d.measured?.expectedGoals ?? null,
  },
  {
    key: "xa",
    head: "xA",
    title: "Expected assists — FPL's",
    of: (d) => d.measured?.expectedAssists ?? null,
  },
];

/** Two decimals for the expected pair and whole numbers for the rest: xG is a
 *  fraction of a goal and printing it as one is the only way it means anything,
 *  while a rounded 0 would say he had no chances. */
function figure(key: string, value: number | null): string {
  if (value === null) return "—";
  return key === "xg" || key === "xa" ? value.toFixed(2) : String(value);
}

export default function SquadRows({
  lines,
  projected,
  onOpen,
}: {
  lines: SquadDetailLine[];
  /** Whether the points are Fantrax's projection rather than a season played.
   *  The heading says which, because the numbers cannot. */
  projected: boolean;
  /** Absent on the head-to-head board, which has no player card to open. A row
   *  that looked like a button and did nothing is worse than a row. */
  onOpen?: (player: SquadPlayerDetail) => void;
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
    <div className="overflow-x-auto">
      <div className="flex flex-col lg:min-w-max">
        {/* One bevelled strip over the whole squad, the way a CM table is headed —
          rather than a small-caps label per position group, which made five
          headings and no columns. The group bars below separate; this names. */}
        <div className="cm-bevel flex min-h-7 items-center gap-2 px-2 text-3xs font-bold uppercase">
          <span className="w-6 shrink-0" />
          <span className="min-w-0 flex-1 lg:min-w-36 lg:max-w-[18rem]">
            Player
          </span>
          <span className="w-12 shrink-0 text-right lg:hidden">Match</span>
          {STATS.map((stat) => (
            <span
              key={stat.key}
              title={stat.title}
              className="hidden w-14 shrink-0 text-right lg:block"
            >
              {stat.head}
            </span>
          ))}
          {scored ? (
            <span className="w-8 shrink-0 text-right">
              {projected ? "Proj" : "FPts"}
            </span>
          ) : null}
        </div>

        {lines.map((line) => (
          <section key={line.position} className="flex flex-col">
            {/* CM's group separator: the pressed face, so the strip above reads as
              the head and this reads as a divider inside what it heads. */}
            <h3 className="cm-bevel-pressed flex items-baseline gap-1.5 px-2 py-0.5 font-display text-3xs font-bold uppercase text-ink">
              {line.position ? positionGroup(line.position) : UNPLACED}
              <span className="numeric font-normal">{line.players.length}</span>
            </h3>
            <ul className="cm-rows flex flex-col">
              {line.players.map((player) => (
                <li key={player.rostered.slot.fantraxId}>
                  <Row
                    player={player}
                    onOpen={onOpen && (() => onOpen(player))}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function Row({
  player,
  onOpen,
}: {
  player: SquadPlayerDetail;
  onOpen?: () => void;
}) {
  const { club, points } = player;
  const colours = clubColours(club?.shortName ?? "");
  const resolved = isResolved(player.rostered) ? player.rostered : null;
  const done = contribution(resolved ? resolved.stats : []);
  // Null for a slot the bridge has not settled, which is ordinary — the pool
  // carries academy names FPL has never listed — and reads as silence.
  const footballer = resolved?.player ?? null;
  const started = kickedOff(player.opposition);
  // Two is what fits beside the minutes in the fixture column.
  const chips = chipsFor(done).slice(0, 2);

  // One line, not two. Stacking his club under his name doubled the height of a
  // fifteen-row list to carry two short strings that sit happily beside each
  // other.
  const inside = (
    <>
      <span
        className="grid h-6 w-6 shrink-0 place-items-center p-[2px]"
        style={{ backgroundColor: colours.primary }}
      >
        {club ? (
          /* Sized in both axes. `h-full` resolves to auto against an
             auto-sized grid row, so only the width bound applied and a 150:112
             crest rendered 20 x 26.8 inside a 20 x 20 box — overhanging the
             coloured tile above and below on every row. */
          <Image
            src={crestUrl(club)}
            alt=""
            width={18}
            height={18}
            className="h-5 w-5 object-contain"
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

      {/* `lg:min-w-36` is load-bearing: `flex-1 min-w-0` gives way first when the
          fixed columns outgrow the row, and what gave way was the one thing on
          the line a reader cannot infer. Measured at 1440 in a 554px column on
          31 Aug: every name was **0px wide**. */}
      <span className="min-w-0 flex-1 truncate text-sm font-medium lg:min-w-36 lg:max-w-[18rem]">
        {playerName(player.rostered)}
      </span>

      {/* Why he is not playing, in the place CM put it: beside the name, before
          anything numeric. Silent for a fit man. */}
      <StateBox player={footballer} />

      <span className="numeric shrink-0 text-3xs text-faint">
        {club?.shortName ?? "unmapped"}
      </span>

      {/* What he has made of his match, and nothing before he starts one.
          **No fixture chip here** (Craig, 31 Aug): the coloured box is handy on
          the pitch, where a card has room for it and a manager is picking a
          side, and it was turning up on five screens. A list is a list of
          readings, and Championship Manager's own squad list carries no
          opponent at all — its columns are position, age, form, morale,
          condition, value (`cm9900/25.jpg`, and `10.jpg`; `12.jpg` shows the
          same columns but is Everton TRAINING, which is not the squad list).

          Phone only. Above `lg` the stat columns below say the same thing at
          more length, so this was the same match twice on one row. */}
      {started ? (
        <span className="flex w-12 shrink-0 items-center justify-end gap-0.5 lg:hidden">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className={`numeric px-1 text-[0.625rem] font-bold leading-[1.4] ${chip.className}`}
            >
              {chip.label}
            </span>
          ))}
          <span className="numeric text-[0.625rem] font-bold text-muted">
            {done.minutes}&apos;
          </span>
        </span>
      ) : (
        <span className="w-12 shrink-0 lg:hidden" />
      )}

      {/* The stat columns, at desk width only. On a phone the rows are the
          subject and the fixture and the total are what a manager is scanning
          for; here there is room for what he actually did. */}
      {STATS.map((stat) => (
        <span
          key={stat.key}
          className="numeric hidden w-14 shrink-0 text-right text-2xs font-bold text-mid lg:block"
        >
          {/* A man who has not kicked off has not scored nought — he has not
              played, and DESIGN §7 puts a dash there. `contribution([])` answers
              zeros for every field, which is right for the sum it is doing and
              wrong for a column: fourteen rows of noughts before a ball is
              kicked reads as a squad that did nothing. */}
          {started ? figure(stat.key, stat.of(done)) : "—"}
        </span>
      ))}

      {/* Undefined is no table at all and takes the cell with it; null is a table
          that does not name him, which is a dash. */}
      {points === undefined ? null : (
        <span className="numeric w-8 shrink-0 text-right text-sm font-bold">
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
    "cm-row flex min-h-11 w-full items-center gap-2 px-2 py-1 text-left";

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
