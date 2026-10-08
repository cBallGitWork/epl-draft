// The league's derbies: names the managers gave their meetings, by team id (Craig, 8 Oct 2026).

/** One derby as `data/leagues/derbies.json` holds it: any two of `teams` meeting play it. */
export interface Derby {
  /** Who meets, in the managers' own names; for whoever edits the file, never printed. */
  between?: string;
  teams: readonly string[];
  /** The first is its name; any after are what else it is called. */
  names: readonly string[];
  /** Why it is a derby, when the managers said. */
  why?: string;
}

/** What one meeting is called: its name, what else it goes by, and why. */
export interface DerbyName {
  name: string;
  also: string[];
  why: string[];
}

/** The derby two teams play, or null; a derby of exactly these two outranks one of a wider group. */
export function derbyOf(derbies: readonly Derby[], a: string, b: string): DerbyName | null {
  if (a === b) return null;
  const played = derbies
    .filter((derby) => derby.teams.includes(a) && derby.teams.includes(b))
    .sort((x, y) => x.teams.length - y.teams.length);
  const names = [...new Set(played.flatMap((derby) => derby.names))];
  if (names.length === 0) return null;
  return { name: names[0], also: names.slice(1), why: played.flatMap((derby) => (derby.why === undefined ? [] : [derby.why])) };
}

/** Every name a meeting goes by, for a check to pass over as it passes over a side's name; none when it is no derby. */
export function derbyNames(derby: DerbyName | null | undefined): string[] {
  return derby == null ? [] : [derby.name, ...derby.also];
}

/** "the Milan Derby", but "The Paul Bunyan Axe" as it stands. */
function called(name: string): string {
  return /^the\s/iu.test(name) ? name : `the ${name}`;
}

/** The derby as a writer's brief states it: what this meeting is called, what else, and why. */
export function derbyBrief(derby: DerbyName): string {
  const also = derby.also.length === 0 ? "" : `, also called ${derby.also.map(called).join(" or ")}`;
  const why = derby.why.length === 0 ? "" : ` Why it is one: ${derby.why.join("; ")}.`;
  return `THE DERBY: this meeting is ${called(derby.name)}${also}.${why} The page prints its name above your words; name it once at most, exactly as written.`;
}
