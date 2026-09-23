import TurnLink from "./TurnLink";
import { PAPER_NAME } from "../../config";
import { londonDate } from "@epl/core";

// The head of an inside page.
//
// **This is the component the 31 Aug revert named**, and it is back because the
// thing it was missing now exists: on that day nothing had ever been filed, so
// a folio numbered empty sections and the top line of a page read "Matches"
// where a masthead belongs. The answer is not to go without one — a paper's
// inside page always says which paper it is and which page you are on — but to
// print it in that order. THE GAZETTA leads, the section and its number sit
// under it, and the masthead is never displaced by a section name.
//
// Small capitals throughout, on §6's rule: a standing head, a dateline and a
// folio are furniture rather than prose, and furniture is Archivo.

export default function Folio({
  section,
  number,
  at,
}: {
  section: string;
  number: number;
  /** When this edition was assembled, as the front page dates it. Null when
   *  there is no edition to date. */
  at: string | null;
}) {
  return (
    <header className="flex flex-col">
      <div className="h-[3px] bg-current" />

      <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 font-sans text-3xs font-semibold uppercase tracking-[0.16em]">
        {/* The way back to the front page is the paper's own name, which is
            where a reader already expects to press. */}
        <TurnLink href="/" className="flex min-h-11 items-center text-muted">
          {PAPER_NAME}
        </TurnLink>
        {at === null ? null : <span className="text-faint">{londonDate(at)}</span>}
      </div>

      <div className="flex items-baseline gap-3 pt-3">
        <span className="paper-display text-3xl font-black leading-none text-ink">{section}</span>
        <span className="font-sans text-3xs font-semibold uppercase tracking-[0.16em] text-faint">
          Page {number}
        </span>
      </div>
    </header>
  );
}
