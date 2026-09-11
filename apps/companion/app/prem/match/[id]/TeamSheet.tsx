import type { CSSProperties } from "react";
import { clubColours, inkOn } from "@epl/core";
import type {
  Club,
  MatchSheetLine,
  PlManMatch,
  PlSquadMan,
  PlTeamSheet,
  PlayerOwner,
} from "@epl/core";
import { IndexCell } from "../../../components/league/TableCells";
import { chipsFor } from "../../../components/league/Chips";
import MatchPlayerCard from "./MatchPlayerCard";
import type { MatchMan } from "./MatchPlayerCard";
import { BOARD, PANEL_FLUSH, ROW_RULE } from "@/app/desk";
import { Head, HeadRow, MUTE, PLATE } from "../../../components/league/TableHeads";
import type { Match } from "./match";

// Championship Manager's team sheet, `cm9900/16.jpg`, both sides at once.
//
// **Every column on it now has a 30/30 source, and three of them did not.** The
// shirt number came from the sister repo's SEASON squad numbers, the sub note
// and the down-the-pitch ordering from its match log — which covers fixtures
// 1-20 of a season whose other exports reach 30, so Ipswich 0-2 Liverpool showed
// a board with no numbers, no sub notes and no order. The Premier League's own
// fixture detail carries all three for every played match: `matchShirtNumber` is
// the number he wore in THIS match, `events` the minute he came on or off, and
// `formation.players` the shape he was named in.
//
// **So the eleven is ordered by the FORMATION and not by a position string.**
// Keeper, then each line as the manager drew it. That is better than sorting on
// a line ordinal in the way a photograph is better than a description: it is the
// actual shape, and a back three stops being read as a back four.

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
    club: club?.name ?? "—",
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

/** FPL's side of a man, found by the `code` the team sheet carries.
 *
 *  Built once for the whole board rather than looked up per row, and kept out of
 *  `Match` on purpose: that interface is the shared assembly four routes read,
 *  and two maps only this board wants do not belong in it. */
interface Join {
  /** What FPL's own per-fixture sheet says he did — the chips are drawn from it.
   *  Undefined for a man who accrued nothing, which includes everyone who did
   *  not play. */
  line: (code: number | null) => MatchSheetLine | undefined;
  points: (code: number | null) => number;
}

function joinOf(match: Match): Join {
  const byId = new Map((match.sheet?.lines ?? []).map((line) => [line.playerId, line]));
  const player = (code: number | null) => (code === null ? undefined : match.byCode.get(code));
  return {
    line: (code) => {
      const id = player(code)?.id;
      return id === undefined ? undefined : byId.get(id);
    },
    points: (code) => {
      const id = player(code)?.id;
      return id === undefined ? 0 : (match.figures.get(id)?.fplPoints ?? 0);
    },
  };
}

/** One man, joined across the two providers that describe him. */
interface Named {
  man: PlSquadMan;
  /** His marks from the Premier League's events. Undefined for a man nothing
   *  happened to, which is most of them. */
  did: PlManMatch | undefined;
  /** Whether he was NAMED on the bench, whether or not he got on. CM greys the
   *  whole bench and so does this. */
  bench: boolean;
}

export default function TeamSheet({
  match,
  sheets,
  events,
  owners,
  injured,
}: {
  match: Match;
  sheets: { home: PlTeamSheet; away: PlTeamSheet };
  events: Map<number, PlManMatch>;
  owners: Map<number, PlayerOwner>;
  /** Who went off hurt, by FPL code — from the commentary, which is the only
   *  place that says so. Empty is the ordinary answer: 5 of 87 substitutions in
   *  a round. */
  injured: ReadonlySet<number>;
}) {
  const join = joinOf(match);
  return (
    // **Stacked under a thumb, paired on a desk.** CM runs both elevens facing
    // each other because its canvas is 800px and each panel gets ~340. Ours is
    // 390, and two columns gave each side 175 against a row that measures 199 —
    // so Liverpool's points column was pushed out of its panel and silently
    // clipped. The document never overflowed and no row reported a scroll
    // width, which is why only the screenshot caught it.
    // **`min-w-0` down the whole chain, or none of it works.** A flex item AND a
    // grid item both default to `min-width: auto`, which means "never shrink
    // below your content" — so a nowrap head plate deep inside sets a floor that
    // propagates all the way out, and the panel came out 392 wide in the 366 a
    // 390 screen leaves it. It is on this wrapper, on each `<section>`, and on
    // the head cell that had the nowrap.
    <div className="grid min-w-0 gap-2 lg:grid-cols-2">
      <Side
        club={match.home}
        sheet={sheets.home}
        events={events}
        owners={owners}
        join={join}
        injured={injured}
      />
      <Side
        club={match.away}
        sheet={sheets.away}
        events={events}
        owners={owners}
        join={join}
        injured={injured}
      />
    </div>
  );
}

/** The eleven keeper-to-attack, then the bench keeper-to-attack.
 *
 *  **A man who came on is still a substitute** (Craig, 11 Sep 2026: *"players
 *  who started on the bench, stay on the bench in grey text, only first elevel
 *  in white, and stay in the same line up positions"*). This used to lift the
 *  men who got on out of the bench, sort them by the minute they arrived, and
 *  set them at full strength beside the starters — which answered "who played"
 *  and lost the thing a team sheet is for, which is who was NAMED and where. The
 *  bench now keeps its own order and its own ink, and what a substitute did is
 *  on his row: `on 79`, his marks, and his score.
 *
 *  **Both halves are sorted on the REAL-LIFE position** (Craig, 11 Sep 2026:
 *  *"original line up ordered by real life position xi / real life position sub
 *  in grey"*). The eleven used to take the FORMATION's order instead — the
 *  manager's drawn shape, keeper first — which is a better answer to "how did
 *  they line up" and a worse one to "who is this list". The shape is still on
 *  the row at the head of the panel, where it can be read in one glance rather
 *  than counted down eleven rows, and the two halves of the board now sort on
 *  the same principle. `sheet.shape` is no longer read here. */
function ordered(sheet: PlTeamSheet, events: Map<number, PlManMatch>): Named[] {
  const did = (man: PlSquadMan) => (man.code === null ? undefined : events.get(man.code));
  const byPosition = (a: PlSquadMan, b: PlSquadMan) =>
    DOWN_THE_PITCH.indexOf(a.position ?? "") - DOWN_THE_PITCH.indexOf(b.position ?? "");

  return [
    ...[...sheet.lineup].sort(byPosition).map((man) => ({ man, did: did(man), bench: false })),
    ...[...sheet.substitutes].sort(byPosition).map((man) => ({ man, did: did(man), bench: true })),
  ];
}

/** Keeper to attack.
 *
 *  Craig, 11 Sep 2026: *"bench sorted by position too / use real life positions
 *  here"*, and then the same for the eleven.
 *
 *  A position this does not know sorts to the FRONT, which is `indexOf`'s -1 and
 *  is deliberate: a man the feed gave no position is one to look at, not one to
 *  bury at the bottom. It has not happened yet — 40 of 40 on the recorded
 *  fixture — so this is the behaviour on a case nobody has seen rather than a
 *  case anybody has. */
const DOWN_THE_PITCH = ["G", "D", "M", "F"];

/** The Premier League's single letters, as football writes them (Craig, 11 Sep
 *  2026: *"positions in yellow are real life abbreviations"*). `G` alone reads
 *  as an initial beside a name; `GK` reads as a position. A letter this map does
 *  not know prints as it came, which is the same tolerance every other provider
 *  field here gets. */
const POSITION: Record<string, string> = { G: "GK", D: "DF", M: "MF", F: "FW" };

function Side({
  club,
  sheet,
  events,
  owners,
  join,
  injured,
}: {
  club: Club | undefined;
  sheet: PlTeamSheet;
  events: Map<number, PlManMatch>;
  owners: Map<number, PlayerOwner>;
  join: Join;
  injured: ReadonlySet<number>;
}) {
  const colours = clubColours(club?.shortName ?? "");
  const rows = ordered(sheet, events);
  // Where the eleven stops and the bench starts, so the rule goes in one place
  // rather than every row asking whether it is the first substitute.
  const bench = rows.findIndex((row) => row.bench);

  return (
    // **The club's colour, spent on the index block rather than a heading.**
    // `.cm-index` takes `--cm-index` from any scope above it — the idiom a
    // manager's own screens already use — so re-pointing it here colours all
    // eighteen blocks down the side at once (Craig, 11 Sep 2026: *"number cards
    // should match teams"*). `inkOn` answers a pale side, which is a case the
    // reference has: `cm9900/16.jpg` is Everton blue against Torquay white.
    <section
      // **`cm-index-club` is a CONTRAST fix, not a look.** Re-pointing the
      // block to a club's colour broke two things that were measured against the
      // app's own deep blue: the 22%-white gradient stop, and `.cm-out`'s dimmed
      // plate ink. `desk.css` carries both and the reasoning; `sweep` found them
      // at 3.63:1 on six shirt numbers at both widths, which is the whole reason
      // that file has a rule at all.
      className={`${PANEL_FLUSH} cm-index-club min-w-0`}
      style={
        {
          "--cm-index": colours.primary,
          "--cm-index-ink": inkOn(colours),
        } as CSSProperties
      }
    >
      {/* **The shape, and not the club's name** (Craig, 11 Sep 2026: *"remove
          Fulham / 4-2-3-1 rows, redundant"*, then *"add formation on top row
          again"* once the pitch came off). The plate above this panel already
          names both clubs and carries the score, so the name was the fact twice;
          the shape was on the pitch and now has nowhere else to be.

          Which list is which, when the two stack under a thumb, is answered by
          the index block — it wears the club's own colour down the whole side. */}
      {sheet.formation === null ? null : (
        <p
          className="numeric flex min-h-7 items-center justify-center text-xs font-bold lg:text-sm"
          style={{ background: colours.primary, color: inkOn(colours) }}
        >
          {sheet.formation}
        </p>
      )}
      {/* **`table-fixed`, because `truncate` cannot shrink an AUTO table.**
          `truncate` is `white-space: nowrap`, which makes a cell's min-content
          its full text width — so auto layout sized the name column to the
          longest name on the sheet and the table came out 378 inside a 366
          panel, with the points column over the edge. Every column but the name
          states a width; the name takes what is left and truncates into it,
          which is what it was always meant to do.

          **The widths go on the HEAD row**, which is the half of `table-fixed`
          that bites: a fixed table takes its column widths from the first row
          and ignores every cell below it. Stating them on the `<td>`s left the
          head row's six unsized cells to split the table into sixths, and the
          names came out as `C…`, `A…`, `J…`. Measured at 390 and 1440. */}
      <table className={`${BOARD} table-fixed`}>
        {/* **Column heads** (Craig, 11 Sep 2026: *"need a FPTS column header,
            position ane name and i guess manager too?"*). The board had none —
            it was CM's own sheet, which labels nothing — and that was fine while
            a row was a number, a name and a figure. It now carries five things
            and three of them share one cell, so the head names that cell's
            contents in the order they appear.

            **The figure is headed `Pts` and cannot be headed `FPts`.** That is
            CLAUDE.md's provenance rule in as many words: `FPts` is Fantrax's
            word for Fantrax's scoring of a slot WE chose, and this is FPL's own
            per-fixture points. The two are different numbers — Fantrax scores
            the roster slot, so Saka at M and Saka at F are paid differently for
            one afternoon. `players/page.tsx` carries what was measured before
            settling on FPL's: Fantrax answers for 6 of 32 participants and
            answers with a PERIOD total. */}
        {/* **The shared strip, not a hand-rolled one** (Craig, 11 Sep 2026:
            *"lets use proper column headers (use shared code)"*). This was three
            bespoke `<th>`s wrapping `HEAD_PLATE` divs — the fourth spelling of a
            head row in the app, and `MUTE`'s own docblock counts seven and says
            what they share. `HeadRow`, `Head` and `PLATE` are what every other
            board wears, so the bevel, the height and the case now match them
            without this file knowing any of the three.

            **No head over the sub column** (*"remiove on header"*). `On` labelled
            a column whose cells read `sub on 61'` — the word twice, and the
            second one abbreviated. `MUTE` keeps it in the tree for a screen
            reader, which is the same call the ten other boards make for the
            columns that name themselves. */}
        <thead>
          <HeadRow>
            {/* **Every cell wears a plate, even the silent ones.** A bare `<th>`
                is `MUTE`'s own answer for a column that names itself, and it is
                the right one in a table whose head strip runs edge to edge. This
                strip does not: the shirt block, the card slot and the marks
                column sit between plates, so an empty `<th>` was a dark hole
                punched through the middle of the bevel. The word goes silent,
                the plate stays — which is what `NameHead` does and is why it
                exists.

                **`px-0` on the silent ones**, because `PLATE`'s own padding is
                for a word and these have none: with it, three columns each grew
                by 12px the row below did not want and the table ran past 390
                with the points column clipped off the right. */}
            <Head width="w-8 lg:w-9">
              <span className={`${PLATE} px-0`}>
                <span className={MUTE}>Shirt number</span>
              </span>
            </Head>
            <Head width="w-3">
              <span className={`${PLATE} px-0`}>
                <span className={MUTE}>Card</span>
              </span>
            </Head>
            {/* **`min-w-0` and a truncating label.** `PLATE` is
                `whitespace-nowrap`, which is right for `Pld` and `Pts` and wrong
                for three words: it set a 212px floor under this column, and a
                grid item will not shrink below its content, so the panel came
                out 392 wide in the 366 a 390 screen leaves it and the points
                column was clipped off the right. Measured — the table itself was
                388 and fitted; it was the BOX that overflowed. */}
            <Head width="">
              <span className={`${PLATE} min-w-0 justify-start`}>
                <span className="min-w-0 truncate">Pos &middot; Player &middot; Manager</span>
              </span>
            </Head>
            <Head width="w-9 lg:w-16">
              <span className={`${PLATE} px-0`}>
                <span className={MUTE}>Goals and cards</span>
              </span>
            </Head>
            <Head width="w-10 lg:w-12" title="FPL's own points for this fixture">
              <span className={PLATE}>Pts</span>
            </Head>
          </HeadRow>
        </thead>
        <tbody>
          {rows.map((row, at) => (
            <Row
              key={`${row.man.code ?? row.man.name}-${row.man.shirt ?? at}`}
              row={row}
              owner={row.man.code === null ? undefined : owners.get(row.man.code)}
              join={join}
              club={club}
              hurt={row.man.code !== null && injured.has(row.man.code)}
              opensBench={at === bench}
            />
          ))}
        </tbody>
      </table>
      {/* **No provenance footer** (Craig, 11 Sep 2026: *"remove Points · FPL's
          own row"*). It was there because DESIGN's provenance rule says ours are
          labelled and never sit in a column headed `FPts` — which the column no
          longer is, and never was: the rule is about not passing our reading off
          as Fantrax's, and nothing on this board claims to be. The docblock at
          the head of `players/page.tsx` carries why the figure is FPL's and what
          was measured before settling on it. */}
    </section>
  );
}

function Row({
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
        {played ? join.points(man.code) : "—"}
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
