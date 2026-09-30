// What a team-news story carries beside its prose: each head-to-head's two sides as printed, refused
// field by field at the edge like every other story's cargo.

/** One man on the sheet: his shirt name, his FPL code for the pitch, the slot he fills, and his
 *  real match this gameweek as it stood when filed ("EVE (H)"); null when his club has none. */
export interface StorySheetMan {
  name: string;
  code: number;
  slot: string;
  against: string | null;
}

/** One side's block: its paragraph, then the eleven and the bench the desk printed from Fantrax. */
export interface StorySheetSide {
  teamId: string;
  formation: string | null;
  line: string;
  xi: StorySheetMan[];
  bench: StorySheetMan[];
}

/** One head-to-head. Where its two sheets meet on a real pitch is woven into the paragraphs. */
export interface StorySheet {
  home: StorySheetSide;
  away: StorySheetSide;
}

export function normalizeSheets(raw: unknown): StorySheet[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const sheets = raw.flatMap((entry: Partial<Record<keyof StorySheet, unknown>> | null) => {
    const home = side(entry?.home);
    const away = side(entry?.away);
    if (home === null || away === null) return [];
    return [{ home, away }];
  });
  return sheets.length === 0 ? undefined : sheets;
}

/** A side prints an eleven or not at all: a paragraph over no names is a report of nothing. */
function side(raw: unknown): StorySheetSide | null {
  const each = raw as Partial<StorySheetSide> | null;
  if (each === null || typeof each !== "object" || typeof each.teamId !== "string" || each.teamId === "") return null;
  const xi = men(each.xi);
  if (xi.length === 0) return null;
  return {
    teamId: each.teamId,
    formation: typeof each.formation === "string" && each.formation !== "" ? each.formation : null,
    line: typeof each.line === "string" ? each.line : "",
    xi,
    bench: men(each.bench),
  };
}

function men(raw: unknown): StorySheetMan[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((man: Partial<StorySheetMan> | null) =>
    typeof man?.name === "string" && man.name.trim() !== "" && Number.isInteger(man.code) && (man.code as number) > 0 && typeof man.slot === "string"
      ? [{ name: man.name, code: man.code as number, slot: man.slot, against: typeof man.against === "string" && man.against !== "" ? man.against : null }]
      : [],
  );
}
