import { ScoutWaiting } from "../Shell";

// The club board's frame while the pool, the stats and the fixtures are read.
export default function Loading() {
  return <ScoutWaiting current="teams" title="Team Stats" />;
}
