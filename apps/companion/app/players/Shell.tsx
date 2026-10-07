import PageHeader from "../components/shell/PageHeader";
import SectionShell from "../components/shell/SectionShell";
import PoolNav from "./PoolNav";
import type { ScoutView } from "./PoolNav";
import { SCOUT } from "../titles";

// The frame Data's screens wear: its own section on the royal-blue bar, and no yellow caption (Craig, 24 Sep
// 2026: "remove the yellow rows"); the tab strip names the view.

/** The pool's panel height in rows, held while its board loads; every other Data view sizes to its content. */
export const POOL_ROWS = 14;

export default function ScoutShell({
  current = "pool",
  rows = 0,
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
