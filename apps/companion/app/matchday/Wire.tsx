import type { MatchEventKind } from "@epl/core";
import Section from "../components/shell/Section";
import { SMALL_CAPS } from "@/app/desk";
import type { WireLine } from "./wireLines";

// The vidiprinter that knows whose everybody is.
//
// Championship Manager's own table body — an index block down the left carrying
// the minute, the name in WHITE beside it (`cm9900/24.jpg`, and the reference
// README's correction of 3 Sep: a name is never cyan) — with one column the game
// never had, because the game was not a draft league: the manager who holds him.
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

/** The word in the event slot. Opta's own vocabulary, said in CM's register. */
const WORD: Record<MatchEventKind, string> = {
  goal: "Goal",
  "penalty-goal": "Pen",
  "own-goal": "OG",
  "disallowed-goal": "VAR",
  "yellow-card": "Booked",
  "red-card": "Sent off",
  substitution: "Sub",
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
  unresolved,
  limit,
}: {
  lines: readonly WireLine[];
  unresolved: number;
  limit: number;
}) {
  if (lines.length === 0) return null;

  return (
    <Section title="The wire" aside="Opta, via the Premier League">
      <ul className="cm-rows">
        {lines.slice(0, limit).map((line) => (
          <Row key={line.key} line={line} />
        ))}
      </ul>
      {/* Our own failure to place a man wears its own mark and is counted.
          A dash means nobody in the league holds him, which is a fact about the
          league; using the same mark for both would be the screen telling itself
          a wrong number. `npm run pl-bridge` takes this back to nought. */}
      {unresolved > 0 ? (
        <p className="text-3xs text-faint">
          {unresolved} {unresolved === 1 ? "man" : "men"} not matched to a player
        </p>
      ) : null}
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

function Row({ line }: { line: WireLine }) {
  return (
    <li className="flex min-h-11 items-stretch gap-2 lg:min-h-7">
      {/* CM's index block, carrying the minute rather than a row number, and
          self-stretched so it is the height of its row — in the reference the
          blue runs edge to edge down the table's left, never floating in it. */}
      <span className="cm-index numeric flex w-9 shrink-0 items-center justify-center text-2xs font-bold">
        {line.minute}&prime;
      </span>
      <span
        className={`flex w-12 shrink-0 items-center ${SMALL_CAPS} ${TONE[line.kind] ?? "text-ink"}`}
      >
        {WORD[line.kind]}
      </span>
      <Man man={line.man} club={line.club} />
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
}: {
  man: WireLine["man"];
  /** The club, on the first man only: the second is in the same match by
   *  construction, and printing it twice would be furniture. */
  club?: string | null;
  /** What he did, when it is not the event's own word. */
  label?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center">
      <span className="flex min-w-0 items-baseline gap-1">
        {label ? <span className={`${SMALL_CAPS} shrink-0 text-faint`}>{label}</span> : null}
        <span className="min-w-0 truncate font-chrome text-sm font-bold text-ink">
          {man?.player.name ?? "\u2014"}
        </span>
        {club ? <span className={`${SMALL_CAPS} shrink-0 text-muted`}>{club}</span> : null}
      </span>
      <span
        className={`truncate text-3xs ${man?.mine === true ? "text-accent" : "text-muted"}`}
      >
        {man?.owner?.teamName ?? <span className="text-faint">&mdash;</span>}
      </span>
    </div>
  );
}
