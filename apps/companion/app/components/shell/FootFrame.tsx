import type { ReactNode } from "react";

// CM's foot row (`cm0102/02.jpg`): a screen's own sub-views switched from the bottom (a `TabStrip` in `foot`), so
// the top keeps one row of blue plates.

/** A screen at least the viewport tall, its foot at the bottom when the body is short and, on a desk, in view when it is long. */
export function FootFrame({ foot, children }: { foot?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-var(--page-top)-var(--page-foot))] flex-col gap-2">
      {children}
      {/* Pinned to the window's foot on the desk, where a long team sheet would push it out of sight (Craig, 24 Sep 2026). */}
      {foot === undefined ? null : <div className="mt-auto lg:sticky lg:bottom-0 lg:z-20">{foot}</div>}
    </div>
  );
}

