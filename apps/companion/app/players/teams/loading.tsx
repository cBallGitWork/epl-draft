import ScoutShell from "../Shell";
import { StackWaiting } from "../[fantraxId]/Waiting";

// The club board's frame while the pool, the stats and the fixtures are read.
export default function Loading() {
  return (
    <ScoutShell current="teams" title="Team Stats" rows={0}>
      <StackWaiting />
    </ScoutShell>
  );
}
