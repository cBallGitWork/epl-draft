import Image from "next/image";
import type { MatchEventKind } from "@epl/core";
import Section from "../components/shell/Section";
import { ROW_NAME, SMALL_CAPS } from "@/app/desk";
import { isBreak, type WireBreak, type WireLine, type WireRow } from "./wireLines";

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
  "red-card": "Sent off",
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

export default function Wire({
  lines,
  title = "The wire",
}: {
  lines: readonly WireRow[];
  /** What this wire is OF. The matchday board's is the whole round and says so
   *  by saying nothing; the head-to-head's is filtered to the thirty men in one
   *  tie, and a panel headed "The wire" over eleven rows of a forty-row round
   *  would be a wire that had quietly lost most of itself. */
  title?: string;
}) {
  if (lines.length === 0) return null;

  return (
    <Section title={title}>
      {/* **A box shorter than the list, and a bar that says so** (Craig, 5 Sep
          2026: "needs a down arrow to see other/previous rows"). The list was
          `slice(0, 8)` and nothing else — rows past the eighth were never
          rendered and nothing on screen said they existed, on a round that
          carries about forty. `.cm-scroll` is CM's own bevelled bar and
          `desk.css` already draws its increment arrow as an inline SVG triangle;
          `.cm-scroll-y` reserves the gutter so it is permanent furniture rather
          than macOS's fade-in overlay. `news/page` set the same shape for the
          same reason — "a list cut at eight with no bar looks like a list with
          eight things in it".

          **And the CAP went with it.** `WIRE_LINES = 8` sliced the list before
          the box ever saw it, so a box that scrolls had 339px of content in a
          320px window — a bar with nowhere to go. Its docblock argued the panel
          was "the panel's length and not a drawer, the rest of the round is on
          the fixture list underneath": a drawer is exactly what Craig asked for,
          and the fixture list names a scorer without saying whose he is, which
          is the one thing this panel is for. The box is the length now. */}
      <ul className="cm-rows cm-scroll cm-scroll-y max-h-80 overflow-y-auto lg:max-h-96">
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

/** The event word's own column, at one width so the names below it line up
 *  whatever the row says. Wide enough for "Sent off", which is the longest. */
const WORD_SLOT = "flex w-12 shrink-0 items-center";

function Row({ line }: { line: WireLine }) {
  return (
    <li className="flex min-h-9 items-start gap-2 lg:min-h-7 lg:items-center">
      <span className={`${WORD_SLOT} ${SMALL_CAPS} ${TONE[line.kind] ?? "text-ink"}`}>
        {WORD[line.kind]}
      </span>
      {/* **One line per MAN, and the two men share a line only where there is
          room.** Craig asked for the manager to sit after the minute rather than
          stacked under the name, and it does — but four things and a crest is
          about 165px, so two men on one 390px line truncated both the name and
          the manager. A goal and its assist are still ONE row, which is the
          thing that mattered; below `lg` the row is two lines of it. */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:flex-row lg:gap-2">
        <Man man={line.man} club={line.club} minute={line.minute} />
        {/* Held open above `lg` so a panel of goals keeps its columns whether or
            not each one was assisted; not held open below, where an empty line
            would be a blank row rather than a blank column. */}
        {line.second === null ? (
          <span className="hidden min-w-0 flex-1 lg:block" />
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
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
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
      <span className={`min-w-0 truncate text-ink ${ROW_NAME}`}>{man?.player.name ?? "\u2014"}</span>
      {minute === undefined ? null : (
        <span className="numeric shrink-0 text-2xs text-muted">({minute}&prime;)</span>
      )}
      <span
        className={`min-w-0 truncate text-2xs ${man?.mine === true ? "text-accent" : "text-muted"}`}
      >
        {man?.owner?.teamName ?? <span className="text-faint">&mdash;</span>}
      </span>
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
    <li className="flex min-h-11 items-center gap-2 lg:min-h-7">
      {/* **Not the accent**, which means "yours · selected · active" on this very
          panel and would be a second meaning for the one mark five screens read.
          Not `--color-live` either: that means a match in PLAY and this is a
          match that has stopped. Quieter than an event word, which is the honest
          rank — a break is a state rather than something that happened to
          somebody, and the scoreline beside it is the news. */}
      <span className={`${WORD_SLOT} ${SMALL_CAPS} text-muted`}>{WORD[row.kind]}</span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {row.sides.map((side, at) => (
          <span key={side.short} className="flex min-w-0 items-center gap-1.5">
            {at === 0 ? null : <span className="text-2xs text-faint">v</span>}
            <Image
              src={side.crest}
              alt=""
              width={18}
              height={18}
              className="h-3.5 w-3.5 shrink-0 object-contain"
            />
            <span className={`${SMALL_CAPS} shrink-0 text-muted`}>{side.short}</span>
            <span className="numeric shrink-0 text-sm font-bold text-ink">
              {side.score ?? <span className="text-faint">&mdash;</span>}
            </span>
          </span>
        ))}
      </span>
    </li>
  );
}
