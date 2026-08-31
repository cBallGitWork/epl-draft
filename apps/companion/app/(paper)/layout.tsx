import type { ReactNode } from "react";
import type { Viewport } from "next";
import { fraunces, newsreader } from "../paperFonts";

// The paper's own layout. Every route in this group is newsprint, and the
// register is put on HERE so that a paper page cannot ship without it — the
// `.paper` scope, the two serifs, the cream browser chrome and the poll cadence
// are declared once, not re-remembered per page.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

// The paper is the one surface that is not dark, so it is the one surface whose
// browser chrome the root layout gets wrong: an iOS address bar in the app's
// dark chrome above a cream page is a seam across the top of the front page.
// sRGB of `--paper` in tokens.css, repeated as a literal for the same reason the
// layout repeats `--color-bg` — this is serialised into a <meta> tag at build
// time and cannot read a CSS variable. Change both together.
export const viewport: Viewport = { themeColor: "#f6ddd2" };

export default function PaperLayout({ children }: { children: ReactNode }) {
  return (
    // The two serifs are declared here and nowhere else. A route that is not the
    // paper never mounts them, which is the whole reason `paperFonts.ts` is not
    // in the root layout.
    //
    // `@container` and not a breakpoint, for everything inside: what decides
    // whether a page can be a broadsheet is the width of the FRAME, not of the
    // window. A `lg:` breakpoint engages at a 1024px window whatever the frame
    // is doing, and while the frame was 42rem that cut a 640px page into 304 and
    // 304 — two equal columns, which is not a lead and a sidebar. The frame is
    // wider now and the sidebar does arrive, but asking the container is what
    // makes that a consequence of there being room rather than a coincidence.
    // `min-h-dvh`: a short page — an inside page's honest Nothing — must not
    // run the stock out halfway down and show the desk's navy beneath the
    // paper. The sheet is the sheet to the foot of the screen.
    <div
      className={`paper @container ${fraunces.variable} ${newsreader.variable} -mx-[var(--page-gutter)] -mb-[var(--page-foot)] -mt-3 flex min-h-dvh flex-col gap-5 px-[var(--page-gutter)] pb-[calc(2rem+var(--page-foot))] pt-4`}
    >
      {children}
    </div>
  );
}
