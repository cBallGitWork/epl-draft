import PageHeader from "../components/shell/PageHeader";
import SectionShell from "../components/shell/SectionShell";
import PoolNav from "./PoolNav";
import type { ScoutView } from "./PoolNav";
import { SCOUT, SCOUT_CAPTION } from "../titles";

// The frame the scouting screens wear: its own section since 6 Sep 2026, on the royal-blue bar,
// because Scout is an activity and not a competition, and the cream plate is spoken for twice.

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
      rows={rows}
    >
      {children}
    </SectionShell>
  );
}
