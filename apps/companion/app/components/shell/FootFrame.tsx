import type { ReactNode } from "react";

// A screen's own sub-views switch from the foot (a `TabStrip` in `foot`), so the top keeps one row of blue plates.

/** A screen at least the viewport tall, its foot at the bottom when the body is short and, on a desk, in view when it is long. */
export function FootFrame({ foot, children }: { foot?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-var(--page-top)-var(--page-foot))] flex-col gap-2">
      {children}
      {foot === undefined ? null : <div className="mt-auto lg:sticky lg:bottom-0 lg:z-20">{foot}</div>}
    </div>
  );
}
