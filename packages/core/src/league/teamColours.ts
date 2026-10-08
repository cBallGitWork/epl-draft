// A fantasy team's own colours, looked up in a table keyed on `teamId` and never the renamable name; the table is the
// app's data, and an unlisted team takes `FALLBACK`. Spent only on the team's own title bar and each side of a head-to-head.

/** A team's plate and its trim: `ClubColours`' shape, declared apart because the layers may not import each other. */
export interface TeamColours {
  /** The plate the team's name is set on. */
  primary: string;
  /** Trim, for anything that needs a second colour off the same identity. */
  secondary: string;
}

/** The neutral for a team nobody has styled: the title bar's own chrome blue, not the clubs' grey. */
const FALLBACK: TeamColours = { primary: "#1d3f9e", secondary: "#FFFFFF" };

/** A team's colours in `table`, or the fallback for one it does not list. */
export function coloursOf(table: Readonly<Record<string, TeamColours>>, teamId: string): TeamColours {
  return table[teamId] ?? FALLBACK;
}
