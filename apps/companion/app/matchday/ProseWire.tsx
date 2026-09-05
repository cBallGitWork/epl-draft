import Section from "../components/shell/Section";
import type { ProseLine } from "../commentary";

// The wire in Opta's own words — the second version, for comparing.
//
// Craig, 5 Sep 2026: *"WE use the match report text? example 'Goal! Newcastle
// United 1, Bournemouth 2. Harvey Barnes (Newcastle United) right footed shot
// from the left side of the box to the top right corner. Assisted by Lewis
// Hall.', but we can shortern it"* — and *"maybe we have different versions of
// the wire on the home page for now and decide which is best?"*
//
// **What this has that the row wire cannot.** Opta writes the sentence, so it
// already says the two things our own rows have no source for: a goal ruled out
// by VAR, and the man who WON a penalty — which our league pays a fantasy assist
// for. Neither is on the round read; both are in the prose for free.
//
// **What it loses.** The ownership. A row wire's whole reason for existing is
// the column that says whose he is, and a sentence has nowhere to put it without
// rewriting Opta's words — which is the one thing this variant must not do,
// because "the game's own words" is its entire claim. So the two wires are not
// two spellings of one thing; they answer different questions, and that is what
// there is to choose between.
//
// It is also the expensive one — see `roundCommentary` for the request count.
// Nothing fetches it unless this variant is the one being read.

export default function ProseWire({ lines }: { lines: readonly ProseLine[] }) {
  if (lines.length === 0) return null;

  return (
    <Section title="The wire" aside="Opta's own words">
      {/* The same box, the same bar, the same reasoning as the row wire's: a list
          cut with nothing to say it is cut reads as a short list. Taller here,
          because a sentence wraps to two lines where a row is one. */}
      <ul className="cm-rows cm-scroll cm-scroll-y max-h-96 overflow-y-auto">
        {lines.map((line) => (
          <li key={line.id} className="flex min-h-9 items-baseline gap-2 py-1">
            {/* The minute in its own column rather than in brackets. The row wire
                brackets it because it follows a NAME; here it leads a sentence,
                and a teleprinter's clock is a column. */}
            {/* The prime marks a MINUTE and nothing else. `FT` is a state, and
                `FT′` reads as the ninety-somethingth minute of a prime number. */}
            <span className="numeric w-10 shrink-0 text-2xs font-bold text-muted">
              {/^\d/.test(line.minute) ? <>{line.minute}&prime;</> : line.minute}
            </span>
            <span className="min-w-0 flex-1 text-2xs text-ink lg:text-xs">{line.text}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
