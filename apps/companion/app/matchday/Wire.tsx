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
// **One line, not two.** The first build stacked the owner under the name on a
// phone, which is `conventions.md`'s two-line pattern applied where it is not
// needed: measured, the row came out at 112px and four of them took the fold.
// Every field here is short — a web name, three letters, a manager's tag — so
// the row is one line at 44 under a thumb and CM's own 28 above `lg`.
//
// **One row per man per event.** A goal produces the scorer's row and the
// assister's, at the same minute, because a goal in this league pays two men and
// usually two different managers. That is what "who got goals and assists" asks
// for, and it keeps every row one man, one event, one owner — uniform grammar,
// uniform height, and the partisan mark lands per row rather than per event.
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

function Row({ line }: { line: WireLine }) {
  return (
    <li className="flex min-h-11 items-center gap-2 lg:min-h-7">
      {/* CM's index block, carrying the minute rather than a row number, and
          self-stretched so it is the height of its row — in the reference the
          blue runs edge to edge down the table's left, never floating in it. */}
      <span className="cm-index numeric flex w-9 shrink-0 items-center justify-center self-stretch text-2xs font-bold">
        {line.minute}&prime;
      </span>
      <span className={`${SMALL_CAPS} w-12 shrink-0 ${TONE[line.kind] ?? "text-ink"}`}>
        {line.role === "assist" && line.kind !== "substitution"
          ? "Assist"
          : WORD[line.kind]}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
        {line.player?.name ?? "\u2014"}
      </span>
      {line.club ? (
        <span className={`${SMALL_CAPS} w-8 shrink-0 text-muted`}>{line.club}</span>
      ) : null}
      {/* The owner at the right edge, which is where every figure in this app
          sits and where the eye is already going. Truncated rather than wrapped:
          a manager knows his own name from four letters and a second line here
          would double the panel. */}
      <span
        className={`w-16 shrink-0 truncate text-right text-2xs ${
          line.mine ? "text-accent" : "text-muted"
        }`}
      >
        {line.owner === null ? <span className="text-faint">&mdash;</span> : line.owner.teamName}
      </span>
    </li>
  );
}
