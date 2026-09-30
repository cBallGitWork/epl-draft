import TurnLink from "./TurnLink";
import { PAPER_NAME } from "../../config";
import { londonDate } from "@epl/core";

// The head of an article: the paper's name, the date, then the story's standing head under them,
// so a section never displaces the masthead. Small capitals throughout: furniture is Archivo (DESIGN §6).

export default function Folio({
  section,
  at,
}: {
  /** The story's standing head. A kind without one prints none. */
  section: string | undefined;
  /** When the story was filed. */
  at: string;
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
        <span className="text-faint">{londonDate(at)}</span>
      </div>

      {section === undefined ? null : (
        <p className="paper-display pt-3 text-3xl font-black leading-none text-ink">{section}</p>
      )}
    </header>
  );
}
