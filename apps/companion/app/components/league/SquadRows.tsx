import Image from "next/image";
import {
  type SquadDetailLine,
  type SquadPlayerDetail,
  clubColours,
  contribution,
  crestUrl,
  isResolved,
  playerName,
} from "@epl/core";
import FixtureChip from "../football/FixtureChip";
import { chipsFor } from "./Chips";

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

/** The four letters our league actually uses, spelled out. Not a vocabulary —
 *  a translation of one, and only for the ones we have seen. */
const POSITION_NAME: Record<string, string> = {
  G: "Goalkeepers",
  D: "Defenders",
  M: "Midfielders",
  F: "Forwards",
};

/** Fantrax allows a roster slot with no position at all, and `squadUnarranged`
 *  carries it rather than dropping the player. It arrives here as an empty
 *  string, which would print as a heading that is not there. */
const UNPLACED = "No position";

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
  return (
    <div className="flex flex-col gap-3">
      {lines.map((line) => (
        <section key={line.position} className="flex flex-col gap-1">
          <h3 className="flex items-baseline gap-1.5 px-0.5 font-display text-2xs font-bold uppercase tracking-widest text-faint">
            {POSITION_NAME[line.position] ?? (line.position || UNPLACED)}
            <span className="numeric font-normal">{line.players.length}</span>
            {/* Only when there is a column to head. */}
            {line.players.some((player) => player.points !== undefined) ? (
              <span className="ml-auto font-normal">{projected ? "Proj" : "FPts"}</span>
            ) : null}
          </h3>
          <ul className="flex flex-col gap-0.5">
            {line.players.map((player) => (
              <li key={player.rostered.slot.fantraxId}>
                <Row player={player} onOpen={onOpen && (() => onOpen(player))} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Row({ player, onOpen }: { player: SquadPlayerDetail; onOpen?: () => void }) {
  const { club, points } = player;
  const colours = clubColours(club?.shortName ?? "");
  const done = contribution(isResolved(player.rostered) ? player.rostered.stats : []);
  // Two is what fits beside the minutes in the fixture column.
  const chips = chipsFor(done).slice(0, 2);

  // One line, not two. Stacking his club under his name doubled the height of a
  // fifteen-row list to carry two short strings that sit happily beside each
  // other.
  const inside = (
    <>
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded p-[2px]"
        style={{ backgroundColor: colours.primary }}
      >
        {club ? (
          <Image src={crestUrl(club)} alt="" width={18} height={18} className="h-full w-full" />
        ) : (
          <span aria-hidden className="numeric text-[0.5rem] font-bold text-white/70">
            ?
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {playerName(player.rostered)}
      </span>

      <span className="numeric shrink-0 text-[0.5rem] tracking-widest text-faint">
        {club?.shortName ?? "unmapped"}
      </span>

      {/* His fixture until he kicks off, and what he has made of it after. The
          same column either way, so a list mid-round does not comb. */}
      {done.played ? (
        <span className="flex w-[4.25rem] shrink-0 items-center justify-end gap-0.5">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className={`numeric rounded-[2px] px-1 text-[0.625rem] font-bold leading-[1.4] ${chip.className}`}
            >
              {chip.label}
            </span>
          ))}
          <span className="numeric text-[0.625rem] font-bold text-muted">{done.minutes}&apos;</span>
        </span>
      ) : (
        <span className="inline-flex w-[4.25rem] shrink-0 overflow-hidden rounded-[3px]">
          <FixtureChip opposition={player.opposition} blank="No fixture" />
        </span>
      )}

      {/* Undefined is no table at all and takes the cell with it; null is a table
          that does not name him, which is a dash. */}
      {points === undefined ? null : (
        <span className="numeric w-8 shrink-0 text-right text-sm font-bold">{points ?? "—"}</span>
      )}
    </>
  );

  const shell = "flex min-h-9 w-full items-center gap-2 rounded-md border border-line bg-surface px-2 py-1 text-left";

  return onOpen ? (
    <button type="button" onClick={onOpen} className={`${shell} hover:bg-raised`}>
      {inside}
    </button>
  ) : (
    <div className={shell}>{inside}</div>
  );
}
