import { once } from "./published";

// The structured cargo some story kinds carry beside their prose: a power
// ranking's rows, and the wire's quiz. Its own file because it is its own
// contract — the prose is paragraphs whatever the kind, and this is everything
// that is not paragraphs.
//
// **QUOTES went on 3 Sep 2026 with the two sketches that were their only
// consumers**, Craig on the press room and the studio: *"this is rubbish,
// ditch."* They were the paper's one licensed invention — the doctrine was that
// a sketch announced as a sketch may put words in a manager's mouth — and the
// exception is gone with the columns that needed it. Nothing in this paper
// invents a quote now, which is the plainer rule and the one HOUSE already
// states without an asterisk.
//
// **The eleven's CAPTIONS were deleted on 3 Sep 2026**, Craig: *"the
// descriptiosn are the same 'STAT + quippy bit', pure ai shite."* He is right
// and it was structural: one sentence per man, asked for eleven at a time,
// against a brief that gives each man a name, a slot and a stat line. There is
// nothing else for that sentence to be. The eleven keeps its column — the
// argument connecting the side is prose a pundit can actually write — and the
// side itself is printed from the facts, unannotated.

/** One team's entry in a power ranking. */
interface StoryRank {
  teamId: string;
  /** Places moved since last time; 0 is held, negative is fell. */
  move: number;
  line: string;
}

interface StoryQuizItem {
  q: string;
  a: string;
}

/** Optional per member: a power ranking carries rows and nothing else, a wire
 *  may carry a quiz. */
export interface StoryExtras {
  ranks?: StoryRank[];
  quiz?: StoryQuizItem[];
}

export function normalizeExtras(raw: unknown): StoryExtras | undefined {
  if (raw === null || typeof raw !== "object") return undefined;
  const extras = raw as Partial<StoryExtras>;
  const out: StoryExtras = {};

  const ranks = Array.isArray(extras.ranks)
    ? extras.ranks.filter(
        (r): r is StoryRank =>
          typeof r?.teamId === "string" && r.teamId !== "" &&
          typeof r.move === "number" && typeof r.line === "string",
      )
    : [];
  if (ranks.length > 0) out.ranks = once(ranks, (r) => r.teamId);

  const quiz = Array.isArray(extras.quiz)
    ? extras.quiz.filter(
        (item): item is StoryQuizItem =>
          typeof item?.q === "string" && item.q !== "" && typeof item.a === "string" && item.a !== "",
      )
    : [];
  if (quiz.length > 0) out.quiz = quiz;

  return Object.keys(out).length > 0 ? out : undefined;
}
