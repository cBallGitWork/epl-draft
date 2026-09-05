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

// **Its height is stated rather than padded, and the phone's is 28.** It was
// `py-1.5` at both widths, which made it whatever the type inside it happened to
// measure — 32px under a thumb. The phone's budget above the first row of data
// is the thing being spent here (five bands of chrome and 64% of the screen left
// for the table), and a caption is a LABEL on a panel rather than a control: it
// is read, never aimed at, so the 44px tap floor is not its floor. The desk's 40
// is unchanged.
export default function Caption({ children }: { children: ReactNode }) {
  return (
    <section className="cm-panel flex min-h-7 items-center justify-center px-2 lg:min-h-10">
      <p className="cm-title text-center font-chrome text-sm font-bold text-accent lg:text-lg">
        {children}
      </p>
    </section>
  );
}
