import PageHeader from "../components/shell/PageHeader";
import SectionShell from "../components/shell/SectionShell";
import PoolNav from "./PoolNav";
import type { ScoutView } from "./PoolNav";
import { SCOUT, SCOUT_CAPTION } from "../titles";
import { StackWaiting } from "./[fantraxId]/Waiting";

// The frame Data's screens wear: its own section since 6 Sep 2026, on the royal-blue bar,
// because Data is an activity and not a competition, and the cream plate is spoken for twice.

/** The panel's height in rows when a screen does not say. */
const PANEL_ROWS = 14;

export default function ScoutShell({
  title,
  current = "pool",
  rows = PANEL_ROWS,
  children,
}: {
  current?: ScoutView;
  rows?: number;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <SectionShell
      header={<PageHeader title={SCOUT} />}
      nav={<PoolNav current={current} />}
      caption={title ?? SCOUT_CAPTION}
      captionOnPhone={false}
      rows={rows}
    >
      {children}
    </SectionShell>
  );
}

/** A Data view's frame while it reads: its own shell over the waiting stack. */
export function ScoutWaiting({ current, title }: { current: ScoutView; title: string }) {
  return (
    <ScoutShell current={current} title={title} rows={0}>
      <StackWaiting />
    </ScoutShell>
  );
}
