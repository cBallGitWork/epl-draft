import type { PlayerStory } from "../../league/fantrax/playerNews";
import type { Sheet, SheetMan } from "./sheet";

// Named men worth a line on sight: a club with no match this gameweek, a man out or a doubt, and a
// man who might not start for his club. The injury is one word off Fantrax's own report; the
// report's sentences never reach the writer, who copied them, credits and all.

export type StarterFlag =
  | { kind: "no-fixture"; man: SheetMan }
  | { kind: "out"; man: SheetMan; why: "injured" | "suspended" | "unavailable"; injury: string | null }
  | { kind: "doubt"; man: SheetMan; injury: string | null }
  | { kind: "may-not-start"; man: SheetMan };

export interface FlagInput {
  /** FPL club ids with a match in this gameweek. */
  playing: ReadonlySet<number>;
  /** Fantrax's latest story on him, already limited to recent ones; null when there is none. */
  news: (man: SheetMan) => PlayerStory | null;
  /** Whether his club is expected to start him; null when there is no reading for his club. */
  predicted: (man: SheetMan) => boolean | null;
}

const OUT: Record<string, "injured" | "suspended" | "unavailable"> = { i: "injured", s: "suspended", u: "unavailable", n: "unavailable" };

/** In reading order: a blank first, because a man with no match cannot score at all. */
export function starterFlags(sheet: Sheet, input: FlagInput): StarterFlag[] {
  const blank = sheet.starters.filter((man) => !input.playing.has(man.player.clubId));
  const playing = sheet.starters.filter((man) => input.playing.has(man.player.clubId));
  const injury = (man: SheetMan) => injuryIn(current(man, input.news(man)));
  return [
    ...blank.map((man) => ({ kind: "no-fixture" as const, man })),
    ...playing.flatMap((man): StarterFlag[] => {
      const why = OUT[man.player.status];
      if (why !== undefined) return [{ kind: "out", man, why, injury: why === "injured" ? injury(man) : null }];
      if (man.player.status === "d") return [{ kind: "doubt", man, injury: injury(man) }];
      return input.predicted(man) === false ? [{ kind: "may-not-start", man }] : [];
    }),
  ];
}

/** A story older than his latest listing is about a man who has since changed (a loan, a ban), so
 *  it is not the news; the listing's date comes from the football layer, its words never do. */
function current(man: SheetMan, story: PlayerStory | null): PlayerStory | null {
  if (story === null || man.player.newsAdded === null) return story;
  const listed = Date.parse(man.player.newsAdded);
  return Number.isNaN(listed) || (story.at ?? 0) >= listed ? story : null;
}

/** The body parts and complaints a team-news line names, in one word. */
const INJURIES = [
  "hamstring", "knee", "ankle", "groin", "calf", "thigh", "neck", "shoulder", "foot", "hip",
  "achilles", "toe", "wrist", "rib", "heel", "quad", "adductor", "abdominal", "concussion", "illness",
  "muscle", "ligament", "fracture", "strain",
];

/** The complaint the report names: its bracketed note first ("Rodon (hamstring)"), else the first
 *  body part in its opening sentence; null when it names none. */
export function injuryIn(story: PlayerStory | null): string | null {
  if (story === null) return null;
  const bracketed = story.content.match(/\(([^)]{2,30})\)/u)?.[1] ?? "";
  const opening = story.content.split(/(?<=[.?!])\s/u)[0] ?? "";
  for (const text of [bracketed, opening]) {
    // The complaint the text names first, wherever it sits on the list.
    const found = INJURIES.map((word) => ({ word, at: text.search(new RegExp(`\\b${word}\\b`, "iu")) }))
      .filter((each) => each.at >= 0)
      .sort((a, b) => a.at - b.at)[0];
    if (found !== undefined) return found.word;
  }
  return null;
}
