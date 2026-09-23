import type { Club, PlayerOwner } from "@epl/core";
import type { PlManMatch } from "@epl/core";
import { IndexCell } from "../../../components/league/TableCells";
import { chipsFor } from "../../../components/league/Chips";
import MatchPlayerCard from "./MatchPlayerCard";
import type { MatchMan } from "./MatchPlayerCard";
import { ROW_RULE } from "@/app/desk";
import type { Join, Named } from "./sheetJoin";
import { DASH } from "@epl/core";

// One man's row on the team sheet, and the card it opens.

/** **This board sets its type a step above the desk's row default**, and it is a
 *  recorded exception to DESIGN §6's density table rather than drift (Craig,
 *  10 Sep 2026: *"the player text could be much bigger on this screen too like
 *  CM… data much bigger too"*).
 *
 *  The reason it earns one: `cm9900/16.jpg` is a screen whose ONLY content is
 *  twenty-two names and their figures, so the game gives them the room a
 *  many-column board cannot. Every other list on the desk shares its width with
 *  four or more measures and takes `ROW_NAME`'s `sm`/`lg:base`; this one carries
 *  a name, a mark and one figure, and at `sm` it was setting a whole screen in
 *  the size other screens use for a column of noughts.
 *
 *  It does NOT change `ROW_NAME` itself. Six other boards wear that recipe and
 *  none of them has the room. */
const SHEET_NAME = "font-chrome text-base font-bold lg:text-lg";

/** The position he was NAMED in, in the accent, before his name (Craig, 11 Sep
 *  2026: *"put the real life position before their name in yellow"*). The
 *  Premier League's own `G`/`D`/`M`/`F` — a football fact about this afternoon
 *  and not FPL's `element_type`, which is a league one and lives in the league
 *  adapter. `PlSquadMan.position` carries the count. */
const SHEET_POSITION = "numeric shrink-0 text-2xs font-bold text-accent lg:text-xs";

/** The league squad holding him, in brackets after the name — the same move the
 *  scoresheet made on 11 Sep, for the same reason: a team name is a gloss on the
 *  name it follows, not a fact with a row of its own. */
const SHEET_OWNER = "text-2xs font-normal text-faint lg:text-xs";

/** The figure beside him, sized to match. `ROW_FIGURE` is `sm` at both widths —
 *  which Craig set on 10 Sep after "numbers in rows are good on desktop, still
 *  small/hard to read to mobile" — and the same argument applies harder here,
 *  where the figure is the point of the row.
 *
 *  **Two steps up again on 11 Sep 2026** (*"fantasy score bigger"*). This tab is
 *  named Line Ups and the score is the one thing on the row that is not a fact
 *  about the man; it is what the afternoon was worth, which is the question the
 *  app exists to answer. */
const SHEET_FIGURE = "text-xl lg:text-2xl";

/** How many chips a row shows before it stops. Two, which is `chipsFor`'s own
 *  reasoning read at a narrower column, and this one shares its width with the
 *  sub note. */
const MARKS = 2;

/** The name group's own box, shared by the row and by the trigger that opens the
 *  card — one string, so a tap target and the thing it looks like cannot drift.
 *  `w-full` because it is a `<button>` now and a button does not fill its cell
 *  the way a block link did. */
const NAME_CELL =
  "group flex min-h-11 w-full items-baseline gap-1.5 px-1.5 text-left lg:min-h-9";

/** Everything the card shows, off the row that opened it — no read, no second
 *  join. The chips are resolved HERE rather than passed as a provider row,
 *  because `chipsFor` is the board's own vocabulary and the card should not
 *  learn it. */
function card(
  row: Named,
  join: Join,
  owner: PlayerOwner | undefined,
  club: Club | undefined,
  hurt: boolean,
): MatchMan {
  const { man, did, bench } = row;
  const line = join.line(man.code);
  const played = !bench || did?.onAt != null;
  return {
    code: man.code,
    // The board's own spellings, so the card is the row enlarged rather than a
    // second opinion about the same man.
    name: man.name,
    position: man.position === null ? null : (POSITION[man.position] ?? man.position),
    shirt: man.shirt,
    captain: man.captain,
    club: club?.name ?? DASH,
    // The short name too, for his card's title plate — `clubColours` is keyed on
    // it and the display name will not do.
    clubShort: club?.shortName ?? null,
    owner: owner?.teamName ?? null,
    points: played ? join.points(man.code) : null,
    onAt: did?.onAt ?? null,
    offAt: did?.offAt ?? null,
    booked: did?.booked ?? null,
    sentOff: did?.sentOff ?? null,
    hurt,
    marks: (line === undefined ? [] : chipsFor(line)).map((chip) => ({
      label: chip.label,
      className: chip.className,
    })),
    bench,
  };
}

/** The two chips the card block already draws.
 *
 *  Enciso shipped for one screenshot with a yellow rectangle AND a `YC` chip
 *  beside it — the same fact twice, which is the thing DESIGN's "strip what
 *  another column owns" is about. The block is CM's own mark and it is the one
 *  that stays. */
const CARDED = new Set(["YC", "RC"]);

/** The Premier League's single letters, as football writes them (Craig, 11 Sep
 *  2026: *"positions in yellow are real life abbreviations"*). `G` alone reads
 *  as an initial beside a name; `GK` reads as a position. A letter this map does
 *  not know prints as it came, which is the same tolerance every other provider
 *  field here gets. */
const POSITION: Record<string, string> = { G: "GK", D: "DF", M: "MF", F: "FW" };

export default function SheetRow({
  row,
  owner,
  join,
  club,
  hurt,
  opensBench,
}: {
  row: Named;
  owner: PlayerOwner | undefined;
  join: Join;
  /** For the card, which names the club a row cannot spare the width for. */
  club: Club | undefined;
  /** Whether he went off injured. */
  hurt: boolean;
  opensBench: boolean;
}) {
  const { man, did, bench } = row;
  // A man who never got on has no afternoon to put a figure against; a dash is
  // the honest answer and a nought would be a claim (DESIGN §7).
  const played = !bench || did?.onAt != null;
  // **Grey is "not on the pitch at the whistle"**, which is CM's own rule read
  // off `cm9900/02.jpg` (Craig, 11 Sep 2026: *"when sub off, you go grey / sub
  // on, go white (dont switch position)"*). Pressman is greyed with `ut 77`
  // beside him and Srnicek is WHITE with `in 77` — and Srnicek is still in the
  // bench block, twelfth down the list, because coming on does not move a man
  // up the sheet. So the ink is about the match and the POSITION is about the
  // team sheet, and the two say different things on purpose.
  const finished = played && did?.offAt == null;
  const line = join.line(man.code);

  return (
    // **A rule where the bench starts** (Craig, 11 Sep 2026: *"have a row
    // divider for bench"*). It was `border-t-line`, which only re-states the
    // colour every row already has — so the one boundary on the board that means
    // something looked exactly like the sixteen that do not. Two pixels of the
    // panel's own ground, which is how `cm9900/02.jpg` separates its eleven from
    // its five: a gap rather than a line.
    <tr
      className={`${ROW_RULE} ${finished ? "" : "cm-out"} ${
        opensBench ? "border-t-4 border-t-bg" : ""
      }`}
    >
      {/* CM's blue index block, carrying the number he wore in THIS match. */}
      {/* The shirt block keeps pace with the name beside it — `.cm-index` sets
          its own size, so the step up is an addition here rather than a
          reach into the class. */}
      <IndexCell>
        <span className="text-sm lg:text-base">{man.shirt ?? ""}</span>
      </IndexCell>
      {/* **The card, as a card.** `16.jpg` marks a booked man with a small
          coloured block between his number and his name, and every row keeps the
          slot so the names stay in one column. It is a rectangle in an existing
          palette slot rather than an icon — the accent for a booking, `--color-bad`
          for a sending off — so it needs no icon set and no new rule. */}
      {/* **Twice the card it was** (Craig, 11 Sep 2026: *"yellow card symbols
          bigger"*). It was 6x12 and read as a tick of colour rather than as a
          card; `16.jpg` draws a block you can see from across a room, which is
          the whole point of a mark that has to be found while scanning
          eighteen names. */}
      <td className="w-3 px-0">
        {did?.sentOff != null ? (
          <span className="block h-5 w-2.5 rounded-[1px] bg-bad" title={`Sent off ${did.sentOff}'`} />
        ) : did?.booked != null ? (
          <span className="block h-5 w-2.5 rounded-[1px] bg-accent" title={`Booked ${did.booked}'`} />
        ) : null}
      </td>
      <td className="min-w-0 p-0">
        {/* **One row, not two** (Craig, 11 Sep 2026: *"sub min should be on same
            row, see ccm example… owned manager should be on same row too in
            brackets after player"*, and again: *"sub on and manager should be on
            same row as player"*).

            The note and the owner were stacked under the name because the board
            used to run two panels of about 190px at 390 — which stopped being
            true when the sides were stacked rather than paired below `lg`. A
            side now has the whole 390 under a thumb and the row fits, which is
            also what `cm9900/16.jpg` does: number, name, note, figure, all on
            one line. */}
        {/* **Left-aligned, hard against the number block**, which is what
            `cm9900/02.jpg` does and what Craig asked for once he had it beside
            ours (*"left alignted for text"*). Centring was the previous ask and
            it was wrong for the same reason a centred column of anything is: a
            reader scanning eighteen names has no edge to run his eye down.

            **The sub note shares this cell**, pushed to the right edge by
            `ml-auto` the way the game's `in 77` sits. It had a column of its own
            for an hour, and under `table-fixed` a column is reserved on every
            row: 88px held open down the whole sheet so that five rows could use
            it, which left `Bernd L…` where `Bernd Leno (test3331)` fits. Sharing
            the cell means only the rows that carry a note pay for one.

            **It opens a card rather than a page** (Craig, same day: *"clicking
            on a player brings up pop up player card"*). The card is told what
            this row already holds and reads nothing of its own — see
            `MatchPlayerCard`. */}
        <MatchPlayerCard man={card(row, join, owner, club, hurt)} className={NAME_CELL}>
          {man.position === null ? null : (
            <span className={SHEET_POSITION}>{POSITION[man.position] ?? man.position}</span>
          )}
          {/* **His full name** (Craig: *"full name?"*), which is the sheet's own
              `name.display` — `Niclas Alexandersson`, the way the reference
              prints it — rather than FPL's short form. `sheetName` is still the
              right call anywhere the column is narrow; this one is not. */}
          <span className={`min-w-0 shrink truncate group-hover:underline ${SHEET_NAME}`}>
            {man.name}
          </span>
          {man.captain ? <span className="shrink-0 text-2xs text-faint">(c)</span> : null}
          {owner === undefined ? null : (
            <span className={`shrink-0 truncate ${SHEET_OWNER}`}>({owner.teamName})</span>
          )}
          <SubNote did={did} hurt={hurt} />
        </MatchPlayerCard>
      </td>
      {/* **One chip under a thumb and two on a desk.** CM's own board keeps a
          scorer's goals at this width — `16.jpg` prints a small figure beside
          Hutchison's rating — so dropping them entirely to make room was the
          wrong economy: a team sheet that cannot say who scored is missing the
          thing a reader came for. `chipsFor` is ordered most consequential
          first, so the one that survives is the one that decided his
          afternoon. */}
      <td className="w-9 whitespace-nowrap px-1 text-right lg:w-16">
        <span className="inline-flex items-center gap-0.5">
          {(line === undefined ? [] : chipsFor(line))
            .filter((chip) => !CARDED.has(chip.label))
            .slice(0, MARKS)
            .map((chip, at) => (
              // **Bigger, and with room around them** (Craig, 11 Sep 2026:
              // *"more obvious text for goals/yellows etc"*). A `G` at 9px in a
              // 1px-padded box was the smallest thing on a row whose whole
              // purpose is to say what a man did.
              <span
                key={chip.label}
                className={`rounded-[1px] px-1.5 py-0.5 text-2xs font-bold lg:text-xs ${at > 0 ? "hidden lg:inline" : ""} ${chip.className}`}
              >
                {chip.label}
              </span>
            ))}
        </span>
      </td>
      {/* CYAN (Craig, 4 Sep 2026: *"scores need cyan"*): a fantasy score is a
          reading DERIVED from recorded events, which is `--color-info` exactly,
          and `16.jpg` runs its ratings column in the same ink. */}
      <td className={`numeric w-9 px-1.5 text-right font-bold text-info ${SHEET_FIGURE}`}>
        {/* A substitute who got on keeps his figure even though his row is grey:
            the ink says he started on the bench, the number says what he did. */}
        {played ? join.points(man.code) : DASH}
      </td>
    </tr>
  );
}

/** `sub on 64'`, `sub off 71'`, or both — in CM's own ink and now at CM's own
 *  size.
 *
 *  **It says which way, and it is the size of a name** (Craig, 11 Sep 2026:
 *  *"sub font much bigger, and say sub on or off"*). It was `2xs` and read
 *  `on 64` — a footnote in the column where `cm9900/02.jpg` prints `in 77` and
 *  `ut 77` at the same size as the man they belong to, because a substitution is
 *  one of the four things that happened to him and not an annotation on his row.
 *  `on`/`sub` also asked the reader to remember which of the two words meant
 *  which way; `sub on` and `sub off` do not.
 *
 *  Amber is `--color-mid`: "a figure standing alone beside a name", which is
 *  what this is, and `docs/ui/reference/README.md` records it as the game's ink
 *  for an event or a change. */
function SubNote({ did, hurt }: { did: PlManMatch | undefined; hurt: boolean }) {
  const parts = [
    did?.onAt == null ? null : `sub on ${did.onAt}'`,
    // **`inj` where the commentary said so** (Craig, 11 Sep 2026: *"we would
    // like to include players injured too"*). On the note rather than in a
    // column of its own, because it is a fact ABOUT the substitution — 5 of 87
    // in a round, so a column would be empty on the other 82.
    did?.offAt == null ? null : `sub off ${did.offAt}'${hurt ? " inj" : ""}`,
  ].filter((part) => part !== null);
  return parts.length === 0 ? null : (
    <span className="numeric ml-auto shrink-0 whitespace-nowrap pl-2 text-sm font-bold text-mid lg:text-base">
      {parts.join(" · ")}
    </span>
  );
}
