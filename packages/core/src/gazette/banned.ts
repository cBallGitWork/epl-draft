// The phrases the paper does not print, and the check that finds them.
//
// **A rule in a prompt is a hope, and this file is the second half of it.**
// `strangers.ts` says it for names: a rule the model can obey to the letter
// while still breaking it is not a guardrail. The same is true of register.
// HOUSE has banned American sports-desk phrasing since Craig's ruling — *"its
// pure american yank shite talk, its uk sport"* — and on 3 Sep 2026 a front page
// still went out with five headlines built on "bank"; told in the same breath
// never to write "off the bench", the next match report filed was headlined
// "Isidor Off The Bench Wins It Short".
//
// **The list is the single source and the prompt is generated from it**
// (`voice/house.ts` interpolates `BANNED`), so the rule the writer is given and
// the rule the check enforces cannot drift apart — which is the whole reason it
// is here rather than in the copy.
//
// A warning and never a refusal, for `strangers.ts`'s reason: an eager check a
// human reads is useful, and an eager check that refuses would eventually throw
// away a good story over a surname.
//
// Pure by construction: a string in, the hits out. No clock, no network.

/** Why each group is banned, so the next addition has an argument to join.
 *
 *  - **Register** — Craig's own list. American sports-desk voice in a British
 *    football paper, plus "bank", which is not American so much as a tic the
 *    writer converges on when nothing stops it.
 *  - **Sequence** — claims about the shape of a match we cannot see. A minutes
 *    figure says how long he was on, never whether he started or came on, and
 *    we have no events at all: no order, no minute, no substitution. Lifts for
 *    the desks that get events when `data/intel/matches/` exists.
 *  - **Grounds** — recalled and never read. We are given no venue (the
 *    sibling's `matches.parquet` has it null for all twenty of this season's
 *    PL matches), so a ground is real-world knowledge, and it is banned on the
 *    occasions it would have been right as well as the ones it would not.
 *  - **Filler** — sentences that say nothing, which BE TIGHT already forbids in
 *    prose and which arrive anyway.
 *
 *  It is a floor rather than a fence: a phrase not listed here is not thereby
 *  approved, and the check misses everything nobody has thought of yet. */
export const BANNED: readonly string[] = [
  // Register
  "banked", "banks", "bank", "banking",
  "cashed in", "chipped in", "chips in",
  "ran the board", "moved the needle", "move the needle",
  "came up big", "difference maker", "difference-maker",
  "on the day", "at the end of the day", "when all was said and done",
  // Sequence
  "off the bench", "came on", "brought on", "withdrawn", "substituted",
  "opened the scoring", "levelled it", "put them ahead",
  // Grounds
  "Anfield", "Elland Road", "Stamford Bridge", "the Bridge", "Stadium of Light",
  "Old Trafford", "the Emirates", "the Etihad", "Villa Park", "Goodison",
  "St James", "Selhurst Park", "Craven Cottage", "Molineux", "the Amex",
  "Bramall Lane", "Kenilworth Road", "Portman Road", "the London Stadium",
  "King Power", "Turf Moor", "the Gtech", "Hill Dickinson",
  // Filler — the category this list has named since it was written and never
  // carried an entry for. These are the ones the Team Sheet actually reached
  // for on 18 Sep, and a newspaper production editor marked every one.
  //
  // **"knock" is Craig's, and it is absolute** — "knock konck koncks", after it
  // appeared eight times in one column. It is what a writer says when he has
  // not been told what the injury is, and the brief always tells him.
  "knock", "knocks",
  // Weather reports on the column's own shape, addressed to a reader looking
  // at it: "Newcastle carry the heaviest load", "Elsewhere the picture is
  // harder", "Forest bring the day's better news".
  "heaviest load", "reads heaviest", "the picture is harder", "a mixed bag",
  "the better news", "the day's better news", "elsewhere the picture",
  "the shape of the day", "long absence lists",
  // Sentences that survive their own deletion.
  "all told", "make no mistake", "it remains to be seen", "needless to say",
  "the fact remains", "one thing is certain",
];

/** Every banned phrase the prose actually uses, in the order they are listed
 *  and each named once however often it appears.
 *
 *  Whole words only: "bank" must not fire on "Bankole", and a check that cries
 *  wolf on a surname is a check a human stops reading. */
export function banned(prose: string): string[] {
  return BANNED.filter((phrase) =>
    new RegExp(`(?<![\\p{L}])${escape(phrase)}(?![\\p{L}])`, "iu").test(prose),
  );
}

function escape(phrase: string): string {
  return phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
