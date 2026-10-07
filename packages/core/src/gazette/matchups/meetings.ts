import { DRAFT_DESK } from "../../config";
import type { SeasonFact } from "./form";

// Two sides' history, and the men who once belonged to the other: a clean sweep of their meetings, and the old boy.

/** One earlier meeting, from the first side's point of view. */
export interface Meeting {
  period: number;
  for: number;
  against: number;
}

/** Where a man used to be: the side that drafted, traded or released him. */
export interface FormerSide {
  teamId: string;
  how: "drafted" | "traded" | "released";
  /** The gameweek of a trade or a release; the draft's round for a man drafted, never printed. */
  when: number;
}

type Named = { teamId: string; name: string };

/** Every meeting won by one side, from `sweepFrom` meetings on, as a season fact for it; null otherwise. `meetings` are
 *  from `home`'s point of view. */
export function meetingsWon(home: Named, away: Named, meetings: readonly Meeting[]): SeasonFact | null {
  if (meetings.length < DRAFT_DESK.sweepFrom) return null;
  const swept = meetings.every((m) => m.for > m.against) ? [home, away] : meetings.every((m) => m.for < m.against) ? [away, home] : null;
  return swept === null ? null : { teamId: swept[0].teamId, kind: "meetings-won", text: `${swept[0].name} have won all ${meetings.length} meetings with ${swept[1].name}` };
}

/** A man facing a side he once belonged to, and the line that says so. */
export interface OldBoy {
  fantraxId: string;
  line: string;
}

/** The men in an eleven who once belonged to the side they faced. */
export function oldBoys(men: readonly { fantraxId: string; name: string }[], opponent: { teamId: string; name: string }, formerly: ReadonlyMap<string, readonly FormerSide[]>): OldBoy[] {
  return men.flatMap((m) => {
    const was = (formerly.get(m.fantraxId) ?? []).find((f) => f.teamId === opponent.teamId);
    if (was === undefined) return [];
    return [{ fantraxId: m.fantraxId, line: `${m.name} faced ${opponent.name}, who ${was.how === "drafted" ? "drafted him" : `${was.how} him in gameweek ${was.when}`}` }];
  });
}
