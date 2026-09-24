import type { ReactNode } from "react";
import TabStrip, { type Tab } from "./TabStrip";

// CM's foot row (`cm0102/02.jpg`): a screen's own sub-views switched from the bottom, so the top keeps one
// row of blue plates.

/** A screen at least the viewport tall, its foot pinned to the bottom when the body is short. */
export function FootFrame({ foot, children }: { foot?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-var(--page-top)-var(--page-foot))] flex-col gap-2">
      {children}
      {foot === undefined ? null : <div className="mt-auto">{foot}</div>}
    </div>
  );
}

/** The plates in a `FootFrame`'s foot, one per sub-view, linked so each view has a URL. */
export default function FootSwitcher<K extends string>({
  label,
  tabs,
  current,
}: {
  label: string;
  tabs: readonly (Tab & { key: K })[];
  current: K;
}) {
  return <TabStrip label={label} tabs={tabs} current={current} />;
}
