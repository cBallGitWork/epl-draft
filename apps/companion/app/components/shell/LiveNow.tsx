import type { LiveTie } from "./liveTie";
import LiveStrip from "./LiveStrip";

// Awaits the live tie on the server and hands it to `LiveStrip`, or draws nothing when there is none.

export default async function LiveNow({ tie }: { tie: Promise<LiveTie | null> }) {
  const live = await tie;
  if (live === null) return null;
  return <LiveStrip {...live} />;
}
