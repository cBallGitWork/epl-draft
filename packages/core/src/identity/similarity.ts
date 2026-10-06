import { tokens } from "./normalize";

// A faithful port of rapidfuzz's `token_set_ratio`: the thresholds below are calibrated against that metric alone.

/** Accept a fuzzy match at or above this; below it a person looks. */
export const FUZZY_MIN_SCORE = 88;

/** How far clear of the runner-up the winner must be: 87 against 88 is a coin toss, for review. */
export const AMBIGUITY_MARGIN = 3;

/** At or below this the best FPL name in the pool is a stranger's, and the script may record "no FPL counterpart"
 *  unread. Far under `FUZZY_MIN_SCORE` on purpose: "Ehor Yarmolyuk" against "Yehor Yarmoliuk" scores 72. */
export const ABSENCE_MAX_SCORE = 50;

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

/** rapidfuzz `token_set_ratio`, 0–100: word order does not matter, and a contained name scores 100 ("Gabriel"
 *  against "Gabriel Jesus"), which is why match.ts guards containment by surname. */
export function tokenSetRatio(a: string, b: string): number {
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));

  // A name with no tokens compares to nothing; otherwise two empty strings score 100 and match every candidate.
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

/** How two names agree, which `tokenSetRatio` cannot say: "Bruno Fernandes" in "Bruno Borges Fernandes" is
 *  contained, "Keith Andrews" against "Kaine Andrews" conflicts. Compare FULL names, never an FPL variant. */
export function nameAgreement(a: string, b: string): NameAgreement {
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));

  // Nothing to compare is not agreement, so an empty name stays out of the safe bucket.
  if (left.size === 0 || right.size === 0) return "conflicting";

  const leftOnly = [...left].some((token) => !right.has(token));
  const rightOnly = [...right].some((token) => !left.has(token));

  if (!leftOnly && !rightOnly) return "identical";
  return leftOnly && rightOnly ? "conflicting" : "contained";
}
