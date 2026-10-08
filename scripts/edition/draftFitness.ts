import { DRAFT_DESK, isDated, type DraftMan, type DraftSide, type Fixture, type PlayerStory } from "@epl/core";
import { firstStoryAfter, storiesOn } from "./matchdayLeague";

// Fantrax's word on a man after his last match, for the draft report: read only for a man in the eleven whose matches
// are done and who did not play, or started and went off before the hour, and never past the cut-off's `until`.

/** Each man's stories by fantraxId, fetched once whichever cut-off asks. */
export type StoryCache = Map<string, Promise<PlayerStory[]>>;

const worthAsking = (m: DraftMan) => m.left === 0 && (m.minutes === 0 || (m.started === true && m.minutes < DRAFT_DESK.earlyOff));

export async function withFitness(side: DraftSide, fixtures: readonly Fixture[], cache: StoryCache, until: number): Promise<DraftSide> {
  const eleven = await Promise.all(
    side.eleven.map(async (m) => {
      const kickoff = fixtures.filter(isDated).filter((f) => m.matches.some((x) => x.code === f.code)).map((f) => f.kickoff).sort().at(-1);
      if (kickoff === undefined || !worthAsking(m)) return m;
      if (!cache.has(m.fantraxId)) cache.set(m.fantraxId, storiesOn(m.fantraxId));
      return { ...m, fitness: firstStoryAfter(await cache.get(m.fantraxId)!, kickoff, until) };
    }),
  );
  return { ...side, eleven };
}
