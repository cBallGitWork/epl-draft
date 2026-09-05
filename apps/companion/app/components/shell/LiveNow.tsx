import type { LiveTie } from "./liveTie";
import LiveStrip from "./LiveStrip";

// The strip's half of the live tie: it either exists or it does not.
//
// The guards are in `liveTie.ts` now, because the phone's Live plate asks the
// same question and the layout starts it once for both. What is left here is the
// boundary — a server component that awaits, and a client one that decides
// whether the route it landed on already answers in full.

export default async function LiveNow({ tie }: { tie: Promise<LiveTie | null> }) {
  const live = await tie;
  if (live === null) return null;
  return <LiveStrip {...live} />;
}
