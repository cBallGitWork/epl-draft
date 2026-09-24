import ScoutShell from "../Shell";
import { StackWaiting } from "../[fantraxId]/Waiting";

// The planner's frame while its fixtures and ratings are read.
export default function Loading() {
  return (
    <ScoutShell current="planner" title="Fixture planner" rows={0}>
      <StackWaiting />
    </ScoutShell>
  );
}
