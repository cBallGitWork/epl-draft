import type { ReactNode } from "react";
import type { Viewport } from "next";
import { paperFontVariables } from "../paperFonts";

// The paper's register, put on once for every route in the group: `.paper`, the two serifs, cream browser chrome.

// Must match `PAGE_REVALIDATE` in the app's config: Next reads this statically, so it cannot be imported.
export const revalidate = 30;

// `--paper` in tokens.css, as a literal because it is serialised into a <meta> tag: change both together.
export const viewport: Viewport = { themeColor: "#f6ddd2" };

export default function PaperLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Outside the page: `@container` would hold a fixed band to the page, and it would scroll away with it. */}
      <div aria-hidden className="paper paper-statusbar" />
      {/* The serifs mount here only; `@container` sizes the page by its frame; `min-h-dvh` keeps stock to the foot. */}
      <div
        className={`paper @container ${paperFontVariables} -mx-[var(--page-gutter)] -mb-[var(--page-foot)] -mt-3 flex min-h-dvh flex-col gap-5 px-[var(--page-gutter)] pb-[calc(2rem+var(--page-foot))] pt-4`}
      >
        {children}
      </div>
    </>
  );
}
