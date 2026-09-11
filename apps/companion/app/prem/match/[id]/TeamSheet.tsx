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
import { BOARD, HEAD_CELL, HEAD_PLATE, HEAD_PLATE_END, PANEL_FLUSH, ROW_RULE } from "@/app/desk";
import { sheetName } from "./match";
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
  "group flex min-h-11 w-full items-baseline justify-center gap-1.5 px-1.5 text-left lg:min-h-9";

/** Everything the card shows, off the row that opened it — no read, no second
 *  join. The chips are resolved HERE rather than passed as a provider row,
 *  because `chipsFor` is the board's own vocabulary and the card should not
 *  learn it. */
function card(
  row: Named,
  join: Join,
  owner: PlayerOwner | undefined,
  club: Club | undefined,
): MatchMan {
  const { man, did, bench } = row;
  const line = join.line(man.code);
  const played = !bench || did?.onAt != null;
  return {
    code: man.code,
    name: join.name(man),
    position: man.position,
    shirt: man.shirt,
    captain: man.captain,
    club: club?.name ?? "—",
    owner: owner?.teamName ?? null,
    points: played ? join.points(man.code) : null,
    onAt: did?.onAt ?? null,
    offAt: did?.offAt ?? null,
    booked: did?.booked ?? null,
    sentOff: did?.sentOff ?? null,
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
  /** What to call him — FPL's short form where the bridge reaches him. */
  name: (man: { code: number | null; name: string }) => string;
}

function joinOf(match: Match): Join {
  const byId = new Map((match.sheet?.lines ?? []).map((line) => [line.playerId, line]));
  const player = (code: number | null) => (code === null ? undefined : match.byCode.get(code));
  return {
    name: (man) => sheetName(man, match.byCode),
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
}: {
  match: Match;
  sheets: { home: PlTeamSheet; away: PlTeamSheet };
  events: Map<number, PlManMatch>;
  owners: Map<number, PlayerOwner>;
}) {
  const join = joinOf(match);
  return (
    // **Stacked under a thumb, paired on a desk.** CM runs both elevens facing
    // each other because its canvas is 800px and each panel gets ~340. Ours is
    // 390, and two columns gave each side 175 against a row that measures 199 —
    // so Liverpool's points column was pushed out of its panel and silently
    // clipped. The document never overflowed and no row reported a scroll
    // width, which is why only the screenshot caught it.
    <div className="grid gap-2 lg:grid-cols-2">
      <Side club={match.home} sheet={sheets.home} events={events} owners={owners} join={join} />
      <Side club={match.away} sheet={sheets.away} events={events} owners={owners} join={join} />
    </div>
  );
}

/** The eleven in the shape they were named in, then the bench in the order the
 *  sheet lists it.
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
 *  `shape` is used where the feed publishes it and `lineup` where it does not —
 *  both are the same eleven and only the ORDER differs, so a sheet with no
 *  formation loses the shape and keeps every man. */
function ordered(sheet: PlTeamSheet, events: Map<number, PlManMatch>): Named[] {
  const did = (man: PlSquadMan) => (man.code === null ? undefined : events.get(man.code));
  const eleven = (sheet.shape ?? [sheet.lineup]).flat();

  return [
    ...eleven.map((man) => ({ man, did: did(man), bench: false })),
    ...[...sheet.substitutes]
      .sort((a, b) => DOWN_THE_PITCH.indexOf(a.position ?? "") - DOWN_THE_PITCH.indexOf(b.position ?? ""))
      .map((man) => ({ man, did: did(man), bench: true })),
  ];
}

/** Keeper to attack, which is the order the eleven above is already in — the
 *  formation puts the keeper on its first line and the forwards on its last.
 *
 *  Craig, 11 Sep 2026: *"bench sorted by position too / use real life positions
 *  here"*. The bench arrives in the provider's own sequence, which is neither
 *  the order they came on nor any order a reader can use, and the eleven above
 *  it reads down the pitch — so the two halves of one list were sorted on
 *  different principles.
 *
 *  A position this does not know sorts to the FRONT, which is `indexOf`'s -1 and
 *  is deliberate: a man the feed gave no position is one to look at, not one to
 *  bury at the bottom. It has not happened yet — 40 of 40 on the recorded
 *  fixture — so this is the behaviour on a case nobody has seen rather than a
 *  case anybody has. */
const DOWN_THE_PITCH = ["G", "D", "M", "F"];

function Side({
  club,
  sheet,
  events,
  owners,
  join,
}: {
  club: Club | undefined;
  sheet: PlTeamSheet;
  events: Map<number, PlManMatch>;
  owners: Map<number, PlayerOwner>;
  join: Join;
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
      className={PANEL_FLUSH}
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
      <table className={BOARD}>
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
        <thead>
          <tr>
            <th className={HEAD_CELL} colSpan={2}>
              <div className={HEAD_PLATE}>#</div>
            </th>
            <th className={HEAD_CELL}>
              <div className={`${HEAD_PLATE} justify-center`}>
                Pos &middot; Player &middot; Manager
              </div>
            </th>
            <th className={HEAD_CELL} colSpan={2}>
              <div className={HEAD_PLATE_END}>On</div>
            </th>
            <th className={HEAD_CELL} title="FPL's own points for this fixture">
              <div className={HEAD_PLATE_END}>Pts</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, at) => (
            <Row
              key={`${row.man.code ?? row.man.name}-${row.man.shirt ?? at}`}
              row={row}
              owner={row.man.code === null ? undefined : owners.get(row.man.code)}
              join={join}
              club={club}
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
  opensBench,
}: {
  row: Named;
  owner: PlayerOwner | undefined;
  join: Join;
  /** For the card, which names the club a row cannot spare the width for. */
  club: Club | undefined;
  opensBench: boolean;
}) {
  const { man, did, bench } = row;
  // A man who never got on has no afternoon to put a figure against; a dash is
  // the honest answer and a nought would be a claim (DESIGN §7).
  const played = !bench || did?.onAt != null;
  const line = join.line(man.code);

  return (
    <tr className={`${ROW_RULE} ${bench ? "cm-out" : ""} ${opensBench ? "border-t-line" : ""}`}>
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
        {/* **Centred** (Craig, 11 Sep 2026: *"player names etc should be
            centrered"*). The group is the man — his position, his name, his
            captaincy, his owner — and it sits in the middle of what the number
            block and the figure leave it. The sub note is NOT in here: it is a
            fact about the match rather than about the man, it takes the row's
            right-hand edge, and a `ml-auto` inside a centred flex row would be
            two rules arguing about the same space.

            **It opens a card rather than a page** (Craig, same day: *"clicking
            on a player brings up pop up player card"*). The card is told what
            this row already holds and reads nothing of its own — see
            `MatchPlayerCard`. */}
        <MatchPlayerCard man={card(row, join, owner, club)} className={NAME_CELL}>
          {man.position === null ? null : (
            <span className={SHEET_POSITION}>{man.position}</span>
          )}
          <span className={`min-w-0 shrink truncate group-hover:underline ${SHEET_NAME}`}>
            {join.name(man)}
          </span>
          {man.captain ? <span className="shrink-0 text-2xs text-faint">(c)</span> : null}
          {owner === undefined ? null : (
            <span className={`shrink-0 truncate ${SHEET_OWNER}`}>({owner.teamName})</span>
          )}
        </MatchPlayerCard>
      </td>
      <td className="whitespace-nowrap px-1 text-right align-middle">
        <SubNote did={did} />
      </td>
      {/* **One chip under a thumb and two on a desk.** CM's own board keeps a
          scorer's goals at this width — `16.jpg` prints a small figure beside
          Hutchison's rating — so dropping them entirely to make room was the
          wrong economy: a team sheet that cannot say who scored is missing the
          thing a reader came for. `chipsFor` is ordered most consequential
          first, so the one that survives is the one that decided his
          afternoon. */}
      <td className="whitespace-nowrap px-1 text-right">
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

/** `on 64`, `sub 71`, or both — CM's own words, in CM's own ink.
 *
 *  Amber is `--color-mid`: "a figure standing alone beside a name", which is
 *  what this is, and `docs/ui/reference/README.md` records it as the game's ink
 *  for an event or a change. `16.jpg` writes `on 71` and `sub 58` in exactly
 *  this column. */
function SubNote({ did }: { did: PlManMatch | undefined }) {
  const parts = [
    did?.onAt == null ? null : `on ${did.onAt}`,
    did?.offAt == null ? null : `sub ${did.offAt}`,
  ].filter((part) => part !== null);
  return parts.length === 0 ? null : (
    <span className="numeric text-2xs text-mid lg:text-xs">{parts.join(" · ")}</span>
  );
}
