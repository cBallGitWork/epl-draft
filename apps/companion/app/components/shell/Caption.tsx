import type { ReactNode } from "react";

// The yellow caption inside a panel, naming what is in the box.
//
// **Two boxes, not one** (Craig, 1 Sep, against CM's stat screen): the title row
// is a bordered strip of its own and the table under it is a separate block.
// The blue bar above names the SCREEN; this names what is in the panel, and
// every screen in the reference library carries both.
//
// Extracted at three hand-rolled copies — `league/Shell.tsx`, `players/Board.tsx`
// (since deleted) and `squad/[teamId]/Shell.tsx`, the class string byte-identical
// (CODE_RULES §1). `PageHeader.tsx` records the same decision taken once already
// for the bar above it, at five copies and drifting.

// **Its height is stated rather than padded, and the phone's is 28.** It was
// `py-1.5` at both widths, which made it whatever the type inside it happened to
// measure — 32px under a thumb. The phone's budget above the first row of data
// is the thing being spent here (five bands of chrome and 64% of the screen left
// for the table), and a caption is a LABEL on a panel rather than a control: it
// is read, never aimed at, so the 44px tap floor is not its floor. The desk's 40
// is unchanged.
//
// **The DESK's type went up a step and a half on 11 Sep 2026**, and the phone's
// did not. Craig, on the match screen: *"stadium name, data, and gameweek,
// referee row all way to small"*. `cm0102/02.jpg` sets its ground caption at
// about 1.75% of an 800px canvas, which is 25px on a 1440 desk where ours was
// 18 — the same complaint, and the same arithmetic, as the two strips on that
// screen. The phone is left alone because 14px in a 28px band is already most of
// the band, and the budget that band is spent out of has not changed. The height
// does not move at either width: `lg:min-h-10` is 40 and a 24px caption in a
// 28px line box still sits inside it.
// **Desk only where a tab already names the view** (Craig, 28 Sep 2026: "on mobile should we just get rid of the
// yellow titles like 'league table'"): under a thumb the strip's current tab says it, and the band is chrome.
export default function Caption({ deskOnly = false, children }: { deskOnly?: boolean; children: ReactNode }) {
  return (
    <section className={`cm-panel flex min-h-7 items-center justify-center px-2 lg:min-h-10 ${deskOnly ? "max-lg:hidden" : ""}`}>
      <p className="cm-title text-center font-chrome text-sm font-bold text-accent lg:text-2xl">
        {children}
      </p>
    </section>
  );
}
