import Image from "next/image";
import type { MatchEventKind } from "@epl/core";
import Section from "../components/shell/Section";
import { SMALL_CAPS } from "@/app/desk";
import { isBreak, type WireBreak, type WireLine, type WireRow } from "./wireLines";
import Absent from "@/app/components/shell/Absent";

// The vidiprinter that knows whose everybody is.
//
// **Sky's own, and the shape is deliberate** (Craig, 5 Sep 2026, with a still of
// Soccer Saturday's teleprinter: *"the wire should mock Gillette Soccer Saturday
// a little like this. Have the minute in brackets rather than the blue tab."*)
// Sky runs `GOAL   LEEDS 1 BRISTOL CITY 0   LUKE AYLING (16)` — the word, the
// match, and the man with his minute after his name. Ours keeps the word and the
// man and spends the middle of the row on the thing no score centre in the world
// prints: the manager who holds him.
//
// The minute left the blue index block for those brackets. The block was CM's
// own leading cell and it was the loudest object on the panel — a royal-blue
// plate down the left of every row, restating a number that belongs to the name
// beside it. A wire is read down the NAMES.
//
// The name is in WHITE (`cm9900/24.jpg`, and the reference README's correction of
// 3 Sep: a name is never cyan).
//
// **One row per EVENT, and both men on it** (Craig, 5 Sep 2026: "for the wire,
// maybe a goal and assist should be on same line"). It was one row per man, so
// `09' GOAL Isak` sat directly above `09' ASSIST Gakpo` — the same goal, said
// twice, at the same minute, spending two of the four rows the fold pays for on
// one event.
//
// The connection needs no timings, which is what Craig's "we can use timings to
// figure its connected" was allowing for: both men come out of the same Opta
// event in the same positional array, so the pairing is structural. See
// `wireLines.SECOND`.
//
// **Two columns, and one line in each.** Four facts and a phone: the two names
// are what happened and the two managers are what it cost. They were stacked —
// name over owner — until 5 Sep 2026, which is what made a row 44px tall and
// bounded the panel at eight of them; the pair now runs inline and the row is
// `min-h-9`, with the two men sharing a line only from `lg` where there is room.
// Nothing here is a tap target, so the 44px floor was never this row's.
//
// **No row is a link, and the first build got that wrong twice over.**
// `docs/ui/desk.md`'s argument holds for its own reason: sixty 44px controls
// would cost the panel the density it exists for, every man named here is
// tappable one tab across, and at ten past four there is nothing to do with a
// player anyway. That is what lets the desk row sit at 28 rather than 36. The
// first build wrapped each row in a `Link` with `tabIndex={-1}` — which is a
// control hidden from the keyboard, the worse of both answers.

/** The word in the event slot. Opta's own vocabulary, said in CM's register,
 *  plus the two a match says about itself.
 *
 *  `FT` rather than "Full time": the slot is 48px, which is what "Sent off"
 *  needs, and the two-letter form is what every scoreboard in the game has
 *  printed since before Sky had a teleprinter. */
const WORD: Record<MatchEventKind | WireBreak["kind"], string> = {
  goal: "Goal",
  "penalty-goal": "Pen",
  "own-goal": "OG",
  "disallowed-goal": "VAR",
  "yellow-card": "Booked",
  "red-card": "Red",
  substitution: "Sub",
  "full-time": "FT",
};

/** A red card is the negative slot; a yellow one is NOT the accent slot.
 *
 *  `cm9900/22.jpg` inks its own Red Cards label red and we have the same slot
 *  for it. Yellow is unavailable at any price — the accent means "yours" on this
 *  very panel, and a second meaning for it would break the one reading aid five
 *  screens depend on. An own goal and a disallowed goal are losses too. */
const TONE: Partial<Record<MatchEventKind, string>> = {
  "red-card": "text-bad",
  "own-goal": "text-bad",
  "disallowed-goal": "text-bad",
};

export default function Vidiprinter({ lines }: { lines: readonly WireRow[] }) {
  if (lines.length === 0) return null;

  // **No heading.** The tab immediately above it is the word, and a panel that
  // repeats the plate over it is the drift Craig has now cut twice.
  return (
    <Section>
      {/* **No box and no cap: the list IS the page.** It scrolled inside 320px
          and was sliced to eight before that; on its own tab there is nothing
          to be shorter than, and a round's forty rows read down in one go. */}
      <ul className="cm-rows">
        {lines.map((row) =>
          isBreak(row) ? <BreakRow key={row.key} row={row} /> : <Row key={row.key} line={row} />,
        )}
      </ul>
      {/* **The unmatched count is not printed** (Craig, 5 Sep 2026: "remove 1 man
          not matched to a player"). It was here so our own failure to place a
          man wore a different mark from "nobody in the league holds him" — a
          real distinction, and one for US rather than for a reader: he cannot
          act on it, it appears on the screen he opens at ten to four, and
          `npm run pl-bridge` is what takes it back to nought. The COUNT went with
          the line — `wireLines` records why it is a deleted pipeline rather than
          a hidden number, and `Wire` has one field. */}
    </Section>
  );
}

/** What the second man did, which is the only thing the two kinds that have one
 *  disagree about. A goal's second man made it; a substitution's went off. */
const SECOND_WORD: Partial<Record<MatchEventKind, string>> = {
  goal: "Assist",
  "penalty-goal": "Assist",
  substitution: "Off",
};

/** The event word's own column, at one width so the names beside it line up
 *  whatever the row says.
 *
 *  36px, which is four characters: this wire carries goals, reds and full time,
 *  so `Goal` is the longest word it ever prints. `Booked` and `Sub` are in the
 *  table because `MatchEventKind` requires them and not because anything here
 *  draws them — `Sent off` was, and it wrapped to two lines, which made one row
 *  taller than the wire it sits in. */
const WORD_SLOT = "flex w-9 shrink-0 items-center lg:w-12";

/** A man's name on this panel: `ROW_NAME`'s size under a thumb and a step above
 *  it on the desk.
 *
 *  Not `ROW_NAME` itself, which is a name in a TABLE row — this row carries two
 *  of them, two managers and a clock on one 390px line, so its two sizes are
 *  solved against that and not against a table's. Measured 21 Sep 2026 at 390:
 *  the row is 346px, the word slot takes 36, and the two halves need 167 and
 *  125 of the 302 left. */
const WIRE_NAME = "font-chrome text-sm font-bold lg:text-lg";

function Row({ line }: { line: WireLine }) {
  return (
    <li className="flex min-h-9 items-center gap-2 lg:min-h-7">
      <span className={`${WORD_SLOT} ${SMALL_CAPS} ${TONE[line.kind] ?? "text-ink"}`}>
        {WORD[line.kind]}
      </span>
      {/* **One line, both men, at every width** (Craig, 21 Sep 2026), and the
          5:4 is measured rather than chosen: the scorer's half needs 167px and
          the assister's 125 of the 302 a 390 phone leaves, so an even split
          clips the man the row is about. */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Man man={line.man} club={line.club} minute={line.minute} lead />
        {/* Held open above `lg` so a panel of goals keeps its columns whether or
            not each one was assisted; not held open below, where an empty line
            would be a blank row rather than a blank column. */}
        {/* Held open so a panel of goals keeps its columns whether or not each
            one was assisted. */}
        {line.second === null ? (
          <span className="min-w-0 flex-[4]" />
        ) : (
          <Man man={line.second} label={SECOND_WORD[line.kind]} />
        )}
      </div>
    </li>
  );
}

/** One man: his club's crest, his name, the minute, and whoever holds him — in
 *  that order, on ONE line (Craig, 5 Sep 2026: "the club logo goes in front of
 *  the player name, make it pop more", "have the manger name after the minute
 *  number, keep it on one ron").
 *
 *  **It was two lines with the crest fourth.** The name came first, then the
 *  minute, then a 14px crest, then the three letters, and the manager sat
 *  underneath in `3xs`. Two things were wrong with that. The crest is the only
 *  COLOUR the row has — everything else is ink, muted or faint — and it was
 *  behind the two things that already identify the man, doing no work. And the
 *  manager on his own line is what made a wire row 44px tall, which is what
 *  bounded the panel at eight rows.
 *
 *  So the crest leads at 20px, and the row is one line. The three letters go with
 *  the stack: a crest at 20px is legible as a club, and printing the name of the
 *  club beside the picture of it was furniture the row could not afford.
 *
 *  The manager keeps the accent when he is yours, which is the one thing on this
 *  panel the accent means. */
function Man({
  man,
  club,
  label,
  minute,
  lead,
}: {
  man: WireLine["man"];
  /** The club, on the first man only: the second is in the same match by
   *  construction, and printing it twice would be furniture. */
  club?: WireLine["club"];
  /** What he did, when it is not the event's own word. */
  label?: string;
  /** The clock, in brackets after his name, which is Sky's own arrangement
   *  (`LUKE AYLING (16)`). On the first man only — the assist happened at the
   *  same minute as the goal by construction. */
  minute?: string;
  /** Whether this is the man the event is ABOUT — the scorer rather than his
   *  assister. He takes the larger share of the row, because an even split
   *  clips the name the row exists to print. */
  lead?: boolean;
}) {
  return (
    <span
      className={`flex min-w-0 items-center gap-1 lg:gap-1.5 ${lead === true ? "flex-[5]" : "flex-[4]"}`}
    >
      {club === null || club === undefined ? null : (
        <Image
          src={club.crest}
          alt=""
          width={40}
          height={40}
          className="h-5 w-5 shrink-0 object-contain"
        />
      )}
      {label ? <span className={`${SMALL_CAPS} shrink-0 text-faint`}>{label}</span> : null}
      {/* **The name does not shrink and the manager does.** Both were flexible
          and both truncated, so the row lost the man and his owner together;
          measured at 390 with this pair, no player name clips on either half. */}
      <span className={`min-w-0 shrink-0 truncate text-ink ${WIRE_NAME}`}>
        {man?.player.name ?? "\u2014"}
      </span>
      {minute === undefined ? null : (
        <span className="numeric shrink-0 text-xs text-muted lg:text-sm">
          ({minute}&prime;)
        </span>
      )}
      {/* **Bracketed, like the minute** (Craig, 21 Sep 2026). The row reads
          `Kostoulas (45') (test31121)` — the man, then the two things qualifying
          him — and the brackets stop a manager's name being read as part of his.
          **Nothing at all for a man nobody holds**, which is the one place on
          this panel DESIGN §7's dash does not apply: the dash means a figure we
          could not get, and "in nobody's squad" is a fact about a 600-man pool
          that five hundred of them share. */}
      {man?.owner?.teamName === undefined ? null : (
        <span
          className={`min-w-0 max-w-12 shrink truncate text-2xs lg:max-w-none lg:text-xs ${
            man.mine ? "text-accent" : "text-muted"
          }`}
        >
          ({man.owner.teamName})
        </span>
      )}
    </span>
  );
}

/** A match reaching half time or full time — Sky's own `HALF TIME  LEEDS 1
 *  BRISTOL CITY 0`, in the word slot and the two columns the events use.
 *
 *  **No manager under it, and that is what makes it read as a different kind of
 *  line** without a second treatment: an event row is two names over two
 *  managers, and this is one scoreline across the middle. It is the same 44px
 *  row, because a wire whose rows are two heights stops scanning as a wire.
 *
 *  The score is a figure standing alone beside a name, which is the amber slot
 *  (DESIGN §3) — but this line has two of them and they are being compared, so
 *  they are ink like every other scoreline in the app, and only the dash for a
 *  score the provider withheld is quiet. */
function BreakRow({ row }: { row: WireBreak }) {
  return (
    <li className="flex min-h-9 items-center gap-2 lg:min-h-7">
      {/* **Not the accent**, which means "yours · selected · active" on this very
          panel and would be a second meaning for the one mark five screens read.
          Not `--color-live` either: that means a match in PLAY and this is a
          match that has stopped. Quieter than an event word, which is the honest
          rank — a break is a state rather than something that happened to
          somebody, and the scoreline beside it is the news. */}
      <span className={`${WORD_SLOT} ${SMALL_CAPS} text-muted`}>{WORD[row.kind]}</span>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {row.sides.map((side) => (
          <span key={side.name} className="flex min-w-0 items-center gap-1.5">
            <Image
              src={side.crest}
              alt=""
              width={22}
              height={22}
              className="h-[1.125rem] w-[1.125rem] shrink-0 object-contain lg:h-[1.375rem] lg:w-[1.375rem]"
            />
            <span className={`${SMALL_CAPS} min-w-0 truncate text-muted lg:text-xs`}>
              {side.name}
            </span>
            <span className="numeric shrink-0 text-sm font-bold text-ink lg:text-base">
              {side.score ?? <Absent />}
            </span>
          </span>
        ))}
      </span>
    </li>
  );
}
