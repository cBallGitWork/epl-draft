import type { LiveTie } from "./liveTie";
import LiveStrip from "./LiveStrip";

// Awaits the live ties on the server and hands them to `LiveStrip`, or draws nothing when there are none.

export default async function LiveNow({ tie }: { tie: Promise<LiveTie[]> }) {
  const ties = await tie;
  if (ties.length === 0) return null;
  return <LiveStrip ties={ties} />;
}
