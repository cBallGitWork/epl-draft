import type { StoryThread } from "../ledger";
import type { StoryResult } from "../types";
import { storylinesBlock } from "./storylines";

// The two columns written as SPEECH: the press room and the studio.
//
// **These are the one place invented quotes are allowed, because inventing
// them is the joke.** Everywhere else in this paper a quote is forbidden
// outright — nobody in the league has spoken to us and a made-up reaction
// reads exactly like a real one. Here the whole form announces itself as a
// sketch: nobody believes a manager of a fantasy team gave a press conference,
// and the voice files say so in those words.
//
// The facts under the sketch are still ours. A staged quote about a result
// that did not happen is not a joke, it is an error with a funny hat on.

/** One manager, as the sketch plays him. */
export interface Persona {
  teamId: string;
  name: string;
  /** Craig's copy: a couple of words on how this one talks. Empty is fine —
   *  the sketch then plays him off his result alone. */
  trait: string;
}

export function buildPresserBrief(brief: {
  gameweek: number;
  results: readonly StoryResult[];
  personas: readonly Persona[];
  threads: readonly StoryThread[];
}): string {
  const traits = new Map(brief.personas.map((persona) => [persona.teamId, persona.trait]));
  const of = (teamId: string) => {
    const trait = traits.get(teamId);
    return trait === undefined || trait === "" ? "" : ` — plays it ${trait}`;
  };

  const lines = brief.results.map(
    (result) =>
      `- ${result.winner.name} (id ${result.winner.teamId})${of(result.winner.teamId)} beat ${result.loser.name} (id ${result.loser.teamId})${of(result.loser.teamId)} by ${Math.round(result.margin * 10) / 10}`,
  );

  return [
    `THE PRESS ROOM, gameweek ${brief.gameweek}. A comic sketch: the managers of this fantasy league, facing the press after their results. Obviously staged and never presented as real — nobody has spoken to anybody.`,
    lines.length > 0 ? ["THE RESULTS the sketch is played off:", ...lines].join("\n") : null,
    "Write 3 to 5 quotes in `quotes`, each with `teamId` and `speaker` set to the manager's name exactly as given. The beaten reach for excuses, the winners for false modesty, and nobody says anything about a fact you were not given. The body is one short paragraph of scene-setting around them.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

export function buildStudioBrief(brief: {
  gameweek: number;
  /** The tie the two-hander is about, already chosen as the round's biggest. */
  tie: { homeName: string; awayName: string; homePoints: number | null; awayPoints: number | null };
  /** What made it the biggest: the men who decided it, in a line each. */
  talkingPoints: readonly string[];
  anchor: string;
  analyst: string;
  threads: readonly StoryThread[];
}): string {
  return [
    `THE STUDIO, gameweek ${brief.gameweek}. A two-hander on the round's biggest tie, written as television: ${brief.anchor} anchors and ${brief.analyst} analyses. A period sketch of a 1990s football panel — the tactics board, "for me, he's got to be starting him", "take a bow" — and obviously a sketch. Nobody has said any of this.`,
    `THE TIE: ${brief.tie.homeName} ${brief.tie.homePoints ?? "—"}, ${brief.tie.awayName} ${brief.tie.awayPoints ?? "—"}.`,
    brief.talkingPoints.length > 0
      ? ["WHAT DECIDED IT:", ...brief.talkingPoints.map((point) => `- ${point}`)].join("\n")
      : null,
    `Write 6 to 10 alternating lines in \`quotes\`, \`speaker\` set to exactly "${brief.anchor}" or "${brief.analyst}". The anchor asks and sets up; the analyst pontificates. Both stay on the facts above — a sketch about a match that did not happen is not a joke. The body is one short paragraph introducing the segment.`,
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}
