import { tokens } from "./normalize";

// A faithful port of rapidfuzz's `token_set_ratio`, because the threshold below
// is calibrated against that metric and a rough substitute would silently move
// it. Jaccard or plain Levenshtein score these name pairs quite differently, so
// "88" would stop meaning what the sibling project learned it means.

/** Accept a fuzzy match at or above this. Below it we would rather have a human
 *  look than have a confident wrong answer in a file we trust for a season. */
export const FUZZY_MIN_SCORE = 88;

/** How far clear of the runner-up the winner must be. Two candidates scoring
 *  87 and 88 is not a match, it is a coin toss, and a coin toss belongs in the
 *  review pile. */
export const AMBIGUITY_MARGIN = 3;

/** Length of the longest common subsequence. */
function lcsLength(a: string, b: string): number {
  if (a === "" || b === "") return 0;

  let previous = new Array<number>(b.length + 1).fill(0);
  let current = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      current[j] =
        a[i - 1] === b[j - 1]
          ? (previous[j - 1] ?? 0) + 1
          : Math.max(previous[j] ?? 0, current[j - 1] ?? 0);
    }
    [previous, current] = [current, previous];
    current.fill(0);
  }

  return previous[b.length] ?? 0;
}

/** rapidfuzz's indel ratio: similarity by insertions and deletions only, 0–100. */
function indelRatio(a: string, b: string): number {
  if (a === "" && b === "") return 100;
  const total = a.length + b.length;
  if (total === 0) return 0;
  return (2 * lcsLength(a, b) * 100) / total;
}

/** rapidfuzz `token_set_ratio`, 0–100.
 *
 *  Splits both names into token sets and compares three constructed strings: the
 *  shared tokens alone, and the shared tokens joined to each side's leftovers.
 *  Word order stops mattering, which is the property we need — "Mudryk,
 *  Mykhailo" and "Mykhailo Mudryk" are the same footballer.
 *
 *  Note the consequence, which match.ts has to defend against: when one token set
 *  contains the other, the shared-tokens string equals one of the joined strings
 *  and the score is 100. "Gabriel" scores 100 against "Gabriel Jesus". That is
 *  the metric behaving correctly and is why containment needs a surname guard. */
export function tokenSetRatio(a: string, b: string): number {
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));

  // A name with no tokens compares to nothing. Without this, the shared and
  // left-hand strings are both empty, their indel ratio is a perfect 100, and an
  // unnamed player would match every candidate it was offered.
  if (left.size === 0 || right.size === 0) {
    return left.size === right.size ? 100 : 0;
  }

  const shared = [...left].filter((token) => right.has(token)).sort();
  const leftOnly = [...left].filter((token) => !right.has(token)).sort();
  const rightOnly = [...right].filter((token) => !left.has(token)).sort();

  const sharedText = shared.join(" ");
  const leftText = [...shared, ...leftOnly].join(" ");
  const rightText = [...shared, ...rightOnly].join(" ");

  return Math.round(
    Math.max(
      indelRatio(sharedText, leftText),
      indelRatio(sharedText, rightText),
      indelRatio(leftText, rightText),
    ),
  );
}

/** Whether two names merely differ in length, or actually contradict each other. */
export type NameAgreement = "identical" | "contained" | "conflicting";

/** Classify how two names agree, which is what `tokenSetRatio` cannot tell you.
 *
 *  The ratio saturates at 100 whenever one token set contains the other, so
 *  "Bruno Fernandes" inside "Bruno Borges Fernandes" — safe, a middle name we do
 *  not carry — is indistinguishable from "Keith Andrews" against "Kaine
 *  Andrews", where the given names positively disagree and one of the two feeds
 *  is wrong about who this is. Both score 100 and both clear the surname guard,
 *  so neither `confidence` nor `surnameAgrees` can separate them.
 *
 *  Compare the two FULL names, never a name against one of FPL's variants: FPL
 *  publishes a bare surname as a variant, so "Keith Andrews" contains "Andrews"
 *  and every conflict would read as containment. */
export function nameAgreement(a: string, b: string): NameAgreement {
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));

  // Nothing to compare is not agreement. Saying so keeps an empty name out of
  // the safe bucket, where it would be waved through unread.
  if (left.size === 0 || right.size === 0) return "conflicting";

  const leftOnly = [...left].some((token) => !right.has(token));
  const rightOnly = [...right].some((token) => !left.has(token));

  if (!leftOnly && !rightOnly) return "identical";
  return leftOnly && rightOnly ? "conflicting" : "contained";
}
