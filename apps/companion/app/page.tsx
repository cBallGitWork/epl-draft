import { getFootballSnapshot } from "@epl/core";
import GameweekView from "./components/GameweekView";

// The live viewer. Runs entirely off FPL's public API, so it works from the first
// match of the season without Fantrax, a draft, or a single credential.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function HomePage() {
  return <GameweekView snapshot={await getFootballSnapshot()} />;
}
