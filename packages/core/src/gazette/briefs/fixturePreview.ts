import type { StoryThread } from "../ledger";
import { storylinesBlock } from "./storylines";

// The facts a preview piece may use. There is no result and no projection in
// here on purpose: the piece exists because an open head-to-head has men on
// both sides of tonight's game, and the stakes ARE the story.

export interface PreviewDuel {
  homeName: string;
  awayName: string;
  homePoints: number | null;
  awayPoints: number | null;
  /** Men each side of the HEAD-TO-HEAD has in this fixture, by name. */
  homeMen: string[];
  awayMen: string[];
}

export interface FixturePreviewBrief {
  gameweek: number;
  home: string;
  away: string;
  /** The kickoff as display copy, already in league time. */
  kickoff: string;
  duels: PreviewDuel[];
  /** Managers with men in the fixture but no duel in it: a rooting interest. */
  watching: { owner: string; men: string[] }[];
  threads: readonly StoryThread[];
}

export function buildFixturePreviewBrief(brief: FixturePreviewBrief): string {
  const duels = brief.duels.map((duel) =>
    [
      `- ${duel.homeName} ${figure(duel.homePoints)} v ${figure(duel.awayPoints)} ${duel.awayName}, still open.`,
      `  ${duel.homeName} has in this match: ${duel.homeMen.join(", ") || "nobody"}.`,
      `  ${duel.awayName} has in this match: ${duel.awayMen.join(", ") || "nobody"}.`,
    ].join("\n"),
  );

  const watching = brief.watching.map((squad) => `- ${squad.owner}: ${squad.men.join(", ")}`);

  return [
    `PREVIEW, gameweek ${brief.gameweek}: ${brief.home} v ${brief.away}, kick-off ${brief.kickoff}. The match has not been played. You know nothing about how it will go and you must not predict a result — the stakes are the story.`,
    [
      "THE DUELS. Each of these head-to-heads is still open and has men on BOTH sides of this fixture — ninety minutes that can swing a tie on its own. Current head-to-head scores are given; frame what tonight can do to them:",
      ...duels,
    ].join("\n"),
    watching.length > 0
      ? ["ALSO WATCHING, with men in the fixture but no duel in it:", ...watching].join("\n")
      : null,
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

function figure(points: number | null): string {
  return points === null ? "—" : String(points);
}
