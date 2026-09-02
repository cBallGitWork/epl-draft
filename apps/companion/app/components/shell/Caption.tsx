import type { ReactNode } from "react";

// The yellow caption inside a panel, naming what is in the box.
//
// **Two boxes, not one** (Craig, 1 Sep, against CM's stat screen): the title row
// is a bordered strip of its own and the table under it is a separate block.
// The blue bar above names the SCREEN; this names what is in the panel, and
// every screen in the reference library carries both.
//
// Extracted at three hand-rolled copies — `league/Shell.tsx`, `players/Board.tsx`
// and `squad/[teamId]/Shell.tsx`, the class string byte-identical at all three
// (CODE_RULES §1). `PageHeader.tsx` records the same decision taken once already
// for the bar above it, at five copies and drifting.

export default function Caption({ children }: { children: ReactNode }) {
  return (
    <section className="cm-panel px-2 py-1.5">
      <p className="cm-title text-center font-chrome text-sm font-bold text-accent lg:text-lg">
        {children}
      </p>
    </section>
  );
}
