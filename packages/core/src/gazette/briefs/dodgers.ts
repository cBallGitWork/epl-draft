import type { Dodger, NearMiss } from "../dodgers";
import type { StoryThread } from "../ledger";
import { storylinesBlock } from "./storylines";

// The Points Dodgers' brief: each man's near misses in the real football, as counted facts with their minutes.

/** Each miss in words, its minutes to follow. */
const MISSED: Record<NearMiss["kind"], string> = {
  "ruled-out": "a goal ruled out",
  "penalty-missed": "missed a penalty",
  "penalty-saved": "a penalty saved",
  woodwork: "hit the woodwork",
  "set-up-woodwork": "set up a shot that hit the woodwork",
  "clean-sheet-lost": "his side's only goal against, the one that cost him a clean sheet",
};

export function buildDodgersBrief(brief: {
  gameweek: number;
  dodgers: readonly Dodger[];
  threads: readonly StoryThread[];
}): string {
  const men = brief.dodgers.map((man) => `- ${man.playerName} (${man.position}), owned by ${man.ownerName}: ${nearly(man)}`);

  return [
    `THE POINTS DODGERS, gameweek ${brief.gameweek}. The league's men who came closest to points in the real football and got none: no goal, no assist, no clean sheet. The post, the save, the goal chalked off, the clean sheet lost late. Name the man, name whose he is, and enjoy it.`,
    ["THE NEAR MISSES. Every one of these men blanked; a minute is the match clock:", ...men].join("\n"),
    "Two or three short paragraphs. Never say what any of them would have scored, never add a chance you were not given, and never tell anybody what to do next week.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

function nearly(man: Dodger): string {
  const parts = (Object.keys(MISSED) as NearMiss["kind"][]).flatMap((kind) => {
    const at = man.misses.filter((miss) => miss.kind === kind).map((miss) => `${miss.minute} min`);
    return at.length === 0 ? [] : [`${MISSED[kind]} (${at.join(", ")})`];
  });
  if (man.shots > 0) {
    const close = man.close > 0 ? `, ${man.close} of them from close range` : "";
    const box = man.inBox > 0 ? `, ${man.inBox} from inside the box${close}` : "";
    parts.push(`${count(man.shots, "shot")}${box}, ${man.onTarget} on target`);
  }
  if (man.chancesMade > 0) parts.push(`made ${count(man.chancesMade, "chance")} for others`);
  return `${parts.join("; ")}; ${man.minutes} min played`;
}

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}
