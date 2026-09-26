// What a team-news story carries beside its prose: each head-to-head's two sides as printed, refused
// field by field at the edge like every other story's cargo.

/** One side's block: its paragraph, then the eleven and the bench the desk printed from Fantrax. */
export interface StorySheetSide {
  teamId: string;
  formation: string | null;
  line: string;
  xi: string[];
  bench: string[];
}

/** One head-to-head, and where its two sheets meet on a real pitch. */
export interface StorySheet {
  home: StorySheetSide;
  away: StorySheetSide;
  between: string;
}

export function normalizeSheets(raw: unknown): StorySheet[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const sheets = raw.flatMap((entry: Partial<Record<keyof StorySheet, unknown>> | null) => {
    const home = side(entry?.home);
    const away = side(entry?.away);
    if (home === null || away === null) return [];
    return [{ home, away, between: typeof entry?.between === "string" ? entry.between : "" }];
  });
  return sheets.length === 0 ? undefined : sheets;
}

/** A side prints an eleven or not at all: a paragraph over no names is a report of nothing. */
function side(raw: unknown): StorySheetSide | null {
  const each = raw as Partial<StorySheetSide> | null;
  if (each === null || typeof each !== "object" || typeof each.teamId !== "string" || each.teamId === "") return null;
  const xi = names(each.xi);
  if (xi.length === 0) return null;
  return {
    teamId: each.teamId,
    formation: typeof each.formation === "string" && each.formation !== "" ? each.formation : null,
    line: typeof each.line === "string" ? each.line : "",
    xi,
    bench: names(each.bench),
  };
}

function names(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((name): name is string => typeof name === "string" && name.trim() !== "") : [];
}
