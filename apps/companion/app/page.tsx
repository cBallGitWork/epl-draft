import { getFootballSnapshot } from "@epl/core";
import GameweekView from "./components/GameweekView";

// The live viewer. Runs entirely off FPL's public API, so it works from the first
// match of the season without Fantrax, a draft, or a single credential.

// Revalidate often enough to feel live; the fetch layer caches per-endpoint so
// this does not hammer FPL.
//
// This literal deliberately duplicates `REVALIDATE.live` from core config: Next
// requires a segment's `revalidate` to be statically analysable, so it cannot be
// imported. Change both together. (PLATFORM_NOTES records the exception.)
export const revalidate = 30;

export default async function HomePage() {
  return <GameweekView snapshot={await getFootballSnapshot()} />;
}
