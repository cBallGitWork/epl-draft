import ScoutShell from "../Shell";
import { StackWaiting } from "../[fantraxId]/Waiting";

// The projections' frame while the pool and the fixtures are read.
export default function Loading() {
  return (
    <ScoutShell current="projections" title="Projected Points" rows={0}>
      <StackWaiting />
    </ScoutShell>
  );
}
