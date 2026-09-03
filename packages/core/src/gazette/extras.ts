import { once } from "./published";

// The structured cargo some story kinds carry beside their prose: the press
// room's quotes, a power ranking's rows, the quiz. Its own file because it is
// its own contract — the prose is paragraphs whatever the kind, and this is
// everything that is not paragraphs.
//
// **The eleven's CAPTIONS were deleted on 3 Sep 2026**, Craig: *"the
// descriptiosn are the same 'STAT + quippy bit', pure ai shite."* He is right
// and it was structural: one sentence per man, asked for eleven at a time,
// against a brief that gives each man a name, a slot and a stat line. There is
// nothing else for that sentence to be. The eleven keeps its column — the
// argument connecting the side is prose a pundit can actually write — and the
// side itself is printed from the facts, unannotated.

/** A quote in a story that is written as speech — the press room and the
 *  studio, the two places invented quotes are the licensed joke. */
interface StoryQuote {
  /** Who is talking, as printed. */
  speaker: string;
  /** The manager the persona stands for, when there is one to join names to. */
  teamId?: string;
  line: string;
}

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

/** Optional per member: a presser has quotes and nothing else, a wire may
 *  carry a quiz. */
export interface StoryExtras {
  quotes?: StoryQuote[];
  ranks?: StoryRank[];
  quiz?: StoryQuizItem[];
}

export function normalizeExtras(raw: unknown): StoryExtras | undefined {
  if (raw === null || typeof raw !== "object") return undefined;
  const extras = raw as Partial<StoryExtras>;
  const out: StoryExtras = {};

  const quotes = Array.isArray(extras.quotes)
    ? extras.quotes.filter(
        (q): q is StoryQuote =>
          typeof q?.speaker === "string" && q.speaker !== "" &&
          typeof q.line === "string" && q.line !== "" &&
          (q.teamId === undefined || typeof q.teamId === "string"),
      )
    : [];
  if (quotes.length > 0) out.quotes = quotes;

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
