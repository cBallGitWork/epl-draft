// Opta's fixed shot clauses → the words a report may use. First match wins; an unmatched clause is null, never guessed.

/** How a shot was struck, where from, where it went, how it was made, and from what. */
export interface PlShot {
  foot: "right foot" | "left foot" | "header" | null;
  from: string | null;
  to: string | null;
  supply: "pass" | "cross" | "through ball" | "headed pass" | null;
  situation: "corner" | "fast break" | "set piece" | "direct free kick" | "penalty" | null;
}

type Table<T> = readonly (readonly [RegExp, T])[];

const FOOT: Table<PlShot["foot"]> = [
  [/\bright footed\b/, "right foot"],
  [/\bleft footed\b/, "left foot"],
  [/\bheader\b/, "header"],
];

// Left and right are Opta's view of the pitch, which a reader cannot picture, so the side is dropped.
const FROM: Table<string> = [
  [/from very close range/, "from close range"],
  [/from the (?:left side of the |right side of the |centre of the )?six yard box/, "from inside the six-yard box"],
  [/from the (?:centre|left side|right side) of the box/, "from inside the box"],
  [/from a difficult angle and long range/, "from long range, at an angle"],
  [/from a difficult angle/, "from a tight angle"],
  [/from more than \d+ yards/, "from more than 35 yards"],
  [/from long range/, "from long range"],
  [/from outside the box/, "from outside the box"],
];

const TO: Table<string> = [
  [/hits the bar/, "against the bar"],
  [/hits the (?:left|right) post/, "against the post"],
  [/to the (?:bottom (?:left|right) corner)/, "low into the corner"],
  [/to the (?:top (?:left|right) corner)/, "into the top corner"],
  [/to the (?:high|top) centre of the goal/, "high into the middle of the goal"],
  [/to the centre of the goal/, "into the middle of the goal"],
  [/is saved/, "saved"],
  [/is blocked/, "blocked"],
  [/is close, but misses/, "just off target"],
  [/is just a bit too high/, "just over"],
  [/is high and wide/, "high and wide"],
  [/is too high/, "over"],
  [/misses to the (?:left|right)/, "wide"],
];

const SUPPLY: Table<NonNullable<PlShot["supply"]>> = [
  [/Assisted by [^.]*? with a cross/, "cross"],
  [/Assisted by [^.]*? with a through ball/, "through ball"],
  [/Assisted by [^.]*? with a headed pass/, "headed pass"],
  [/Assisted by /, "pass"],
];

const SITUATION: Table<NonNullable<PlShot["situation"]>> = [
  [/following a corner/, "corner"],
  [/following a fast break/, "fast break"],
  [/following a set piece situation/, "set piece"],
  [/from a direct free kick/, "direct free kick"],
  [/converts the penalty|^Penalty (?:missed|saved)/, "penalty"],
];

function first<T>(table: Table<T>, text: string): T | null {
  return table.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

/** A shot line's clauses, each null where Opta's sentence did not say. */
export function shotOf(text: string): PlShot {
  return {
    foot: first(FOOT, text),
    from: first(FROM, text),
    to: first(TO, text),
    supply: first(SUPPLY, text),
    situation: first(SITUATION, text),
  };
}

/** What a VAR review decided, from `VAR Decision: No Goal …`; null when the sentence is not one of Opta's four. */
export function varCallOf(text: string): "no goal" | "no penalty" | "goal stands" | "card upgraded" | null {
  if (/VAR Decision: No Goal/.test(text)) return "no goal";
  if (/VAR Decision: No Penalty/.test(text)) return "no penalty";
  if (/VAR Decision: Goal/.test(text)) return "goal stands";
  if (/VAR Decision: Card upgraded/.test(text)) return "card upgraded";
  return null;
}

/** Minutes of added time the fourth official announced; null when the sentence does not say. */
export function addedMinutesOf(text: string): number | null {
  const said = /announced (\d+) minutes? of added time/.exec(text);
  return said === null ? null : Number(said[1]);
}
