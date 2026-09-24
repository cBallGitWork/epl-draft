import PageHeader from "../components/shell/PageHeader";
import SectionShell from "../components/shell/SectionShell";
import PoolNav from "./PoolNav";
import type { ScoutView } from "./PoolNav";
import { SCOUT } from "../titles";
import { StackWaiting } from "./[fantraxId]/Waiting";

// The frame Data's screens wear: its own section on the royal-blue bar, and no yellow caption (Craig, 24 Sep
// 2026: "remove the yellow rows"); the tab strip names the view.

/** The panel's height in rows when a screen does not say. */
const PANEL_ROWS = 14;

export default function ScoutShell({
  current = "pool",
  rows = PANEL_ROWS,
  children,
}: {
  current?: ScoutView;
  rows?: number;
  children: React.ReactNode;
}) {
  return (
    <SectionShell
      header={<PageHeader title={SCOUT} />}
      nav={<PoolNav current={current} />}
      rows={rows}
    >
      {children}
    </SectionShell>
  );
}

/** A Data view's frame while it reads: its own shell over the waiting stack. */
export function ScoutWaiting({ current }: { current: ScoutView }) {
  return (
    <ScoutShell current={current} rows={0}>
      <StackWaiting />
    </ScoutShell>
  );
}
