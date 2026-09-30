import { possessive } from "./words";

// Two sides' history, and the men who once belonged to the other: the meetings as a record, the last one, and the old
// boy (FM's one true transfer story, 29 Sep 2026 panel). Pure.

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

/** The meetings as a record, from `side`'s point of view, with the last; nothing when they have not met. */
export function meetingLines(side: string, opponent: string, meetings: readonly Meeting[]): string[] {
  if (meetings.length === 0) return [];
  const last = [...meetings].sort((a, b) => b.period - a.period)[0];
  const lastLine =
    last.for === last.against ? `they drew ${last.for}-${last.against} in gameweek ${last.period}` : `${last.for > last.against ? side : opponent} won ${Math.max(last.for, last.against)}-${Math.min(last.for, last.against)} in gameweek ${last.period}`;
  if (meetings.length === 1) return [`the last meeting: ${lastLine}`];
  const [w, d, l] = [meetings.filter((m) => m.for > m.against).length, meetings.filter((m) => m.for === m.against).length, meetings.filter((m) => m.for < m.against).length];
  const record = w === meetings.length ? `${side} have won all ${w} meetings with ${opponent}` : l === meetings.length ? `${opponent} have won all ${l} meetings with ${side}` : `${possessive(side)} record against ${opponent} is won ${w}, drawn ${d}, lost ${l}`;
  return [record, `the last meeting: ${lastLine}`];
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
