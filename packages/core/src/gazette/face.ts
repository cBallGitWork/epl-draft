// The man a story prints a picture of, and the edge that refuses a partial one. Its own file so a
// story and a tie can both carry one without `story.ts` and `published.ts` importing each other.

/** A player the page can print a picture of.
 *
 *  The FPL `code` and not the id: a portrait path keys off the season-stable
 *  code, and this is written to disk in `paper.json` — CODE_RULES §3 forbids
 *  persisting the per-season id. `clubId` is this season's, and is only ever
 *  used to reach a crest at render, never persisted as identity. */
export interface StoryFace {
  code: number;
  name: string;
  clubId: number;
  /** The roster slot he was filed in, for the one thing the picture needs it
   *  for: a goalkeeper's kit is a different shirt, and the shirt is the rung
   *  `PlayerImage` falls to when he has no photograph. Fantrax's own letter —
   *  the SLOT and never a position off the player. */
  position: string | null;
}

/** Every field or none. A face with no code is a portrait we cannot fetch and a face with no name
 *  is a caption we cannot write, so a partial one prints as no picture rather than a broken one. */
export function normalizeFace(value: unknown): StoryFace | null {
  const face = value as Partial<StoryFace> | null;
  if (face === null || typeof face !== "object") return null;
  if (typeof face.code !== "number" || typeof face.name !== "string" || face.name === "" || typeof face.clubId !== "number") {
    return null;
  }
  return { code: face.code, name: face.name, clubId: face.clubId, position: typeof face.position === "string" ? face.position : null };
}
