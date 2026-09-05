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
// **Two columns, name over owner in each.** Four facts and a phone: the two
// names are what happened and the two managers are what it cost, and stacking
// each pair keeps a goal on one row at 390 without truncating a surname to three
// letters. The row is still the 44px floor, because two 11px lines is what 44px
// is for.
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
 *  `HT` and `FT` rather than "Half time" and "Full time": the slot is 48px, which
 *  is what "Sent off" needs, and the two-letter forms are what every scoreboard
 *  in the game has printed since before Sky had a teleprinter. */
const WORD: Record<MatchEventKind | WireBreak["kind"], string> = {
  goal: "Goal",
  "penalty-goal": "Pen",
  "own-goal": "OG",
  "disallowed-goal": "VAR",
  "yellow-card": "Booked",
  "red-card": "Sent off",
  substitution: "Sub",
  "half-time": "HT",
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
  limit,
}: {
  lines: readonly WireRow[];
  limit: number;
}) {
  if (lines.length === 0) return null;

  return (
    <Section title="The wire">
      <ul className="cm-rows">
        {lines.slice(0, limit).map((row) =>
          isBreak(row) ? <BreakRow key={row.key} row={row} /> : <Row key={row.key} line={row} />,
        )}
      </ul>
      {/* **The unmatched count is not printed** (Craig, 5 Sep 2026: "remove 1 man
          not matched to a player"). It was here so our own failure to place a
          man wore a different mark from "nobody in the league holds him" — a
          real distinction, and one for US rather than for a reader: he cannot
          act on it, it appears on the screen he opens at ten to four, and
          `npm run pl-bridge` is what takes it back to nought. The count is still
          computed and still crosses in `Wire.unresolved`, so the day it wants a
          home it has one. */}
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
    <li className="flex min-h-11 items-stretch gap-2 lg:min-h-7">
      <span className={`${WORD_SLOT} ${SMALL_CAPS} ${TONE[line.kind] ?? "text-ink"}`}>
        {WORD[line.kind]}
      </span>
      <Man man={line.man} club={line.club} minute={line.minute} />
      {/* Held open rather than dropped, so a panel of goals keeps its columns
          whether or not each one was assisted. An unassisted goal is a fact and
          the empty half is what says so. */}
      <div className="min-w-0 flex-1">
        {line.second === null ? null : (
          <Man man={line.second} label={SECOND_WORD[line.kind]} />
        )}
      </div>
    </li>
  );
}

/** One man and whoever holds him, stacked. The name is the event and the
 *  manager is what it cost — which is the sentence no other score centre in the
 *  world prints, so it goes under every name rather than only under the ones a
 *  reader owns. */
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
   *  same minute as the goal by construction, and saying it twice is the thing
   *  one row per event was written to stop. */
  minute?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center">
      <span className="flex min-w-0 items-baseline gap-1">
        {label ? <span className={`${SMALL_CAPS} shrink-0 text-faint`}>{label}</span> : null}
        <span className={`min-w-0 truncate text-ink ${ROW_NAME}`}>
          {man?.player.name ?? "\u2014"}
        </span>
        {minute === undefined ? null : (
          <span className="numeric shrink-0 text-2xs text-muted">({minute}&prime;)</span>
        )}
        {club === null || club === undefined ? null : (
          <>
            {/* **The crest, not just the letters** (Craig, 5 Sep 2026: "add team
                logo too for the row"). 14px, which is `ScoreRow`'s own badge on
                a phone — the two rows sit six pixels apart on this screen and a
                club drawn two sizes would be the disagreement this run has been
                closing. The letters stay: a crest at 14px is a colour, and the
                three letters are what a reader actually reads. */}
            <Image
              src={club.crest}
              alt=""
              width={18}
              height={18}
              className="h-3.5 w-3.5 shrink-0 object-contain"
            />
            <span className={`${SMALL_CAPS} shrink-0 text-muted`}>{club.short}</span>
          </>
        )}
      </span>
      <span
        className={`truncate text-3xs ${man?.mine === true ? "text-accent" : "text-muted"}`}
      >
        {man?.owner?.teamName ?? <span className="text-faint">&mdash;</span>}
      </span>
    </div>
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
