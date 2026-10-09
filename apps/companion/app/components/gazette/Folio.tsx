import TurnLink from "./TurnLink";
import { PAPER_NAME } from "../../config";
import { londonDate } from "@epl/core";
import { STANDING_CAPS } from "./heads";

// The head of an article: the paper's name and the date in small capitals. The story's kicker is the article's own.

export default function Folio({
  at,
}: {
  /** When the story was filed. */
  at: string;
}) {
  return (
    <header className="flex flex-col">
      <div className="h-[3px] bg-current" />

      <div className={`${STANDING_CAPS} flex items-baseline justify-between gap-3 border-b border-line py-2`}>
        {/* The way back to the front page is the paper's own name; a phone has no rail arrows, so it points. */}
        <TurnLink href="/" className="flex min-h-11 items-center text-muted">
          <span aria-hidden className="pr-1.5 lg:hidden">
            ←
          </span>
          {PAPER_NAME}
        </TurnLink>
        <span className="text-faint">{londonDate(at)}</span>
      </div>
    </header>
  );
}
