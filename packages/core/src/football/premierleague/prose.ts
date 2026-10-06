import { escapeRegExp } from "../../regExp";

// Opta's own sentence cut down to a wire line: long club names shortened, the club in brackets after a player
// dropped, and nothing paraphrased.

/** Opta's sentence with club names (`names`: Opta's long spelling → the caller's) cut down; unchanged when none match.
 *  One pass, longest first: a prefix would strand a tail, and a name-by-name loop rescans its own output. */
export function shortProse(text: string, names: ReadonlyMap<string, string>): string {
  if (names.size === 0) return text;
  const spellings = new Map<string, string>();
  for (const [long, short] of names) {
    for (const spelling of ampersandVariants(long)) spellings.set(spelling, short);
  }
  const longest = [...spellings.keys()].sort((a, b) => b.length - a.length);
  const alternation = longest.map(escapeRegExp).join("|");

  return (
    text
      // Brackets first: after the replacement they would hold "(Spurs)", not the long name.
      .replace(new RegExp(` \\((?:${alternation})\\)`, "g"), "")
      .replace(new RegExp(alternation, "g"), (found) => spellings.get(found) ?? found)
  );
}

/** A club name in both spellings when it holds an ampersand or `and`: the payload writes `Brighton & Hove Albion`,
 *  Opta's prose `Brighton and Hove Albion`. */
function ampersandVariants(name: string): string[] {
  const swapped = name.includes(" & ")
    ? name.replaceAll(" & ", " and ")
    : name.includes(" and ")
      ? name.replaceAll(" and ", " & ")
      : null;
  return swapped === null ? [name] : [name, swapped];
}

/** One run of Opta's sentence: `event` its opening clause (`Goal!`, `Corner, MUN.`), `name` a man on either sheet,
 *  and `plain` the rest. */
export interface ProseSpan {
  text: string;
  kind: "event" | "name" | "plain";
}

/** Opta's sentence split into its event clause (up to the first `.` or `!`) and the names the caller passes.
 *  Names are looked up, longest first, never pattern-matched; the spans concatenate back to the input exactly. */
export function proseSpans(text: string, names: Iterable<string>): ProseSpan[] {
  // A line that never closes a clause is one clause, and all of it is the event.
  const head = text.search(/[.!]/);
  if (head === -1) return [{ text, kind: "event" }];

  const spans: ProseSpan[] = [{ text: text.slice(0, head + 1), kind: "event" }];
  const rest = text.slice(head + 1);

  const known = [...names].filter((name) => name.length > 0).sort((a, b) => b.length - a.length);
  if (known.length === 0) {
    if (rest.length > 0) spans.push({ text: rest, kind: "plain" });
    return spans;
  }

  const finder = new RegExp(known.map(escapeRegExp).join("|"), "g");
  let at = 0;
  for (const found of rest.matchAll(finder)) {
    const start = found.index;
    if (start > at) spans.push({ text: rest.slice(at, start), kind: "plain" });
    spans.push({ text: found[0], kind: "name" });
    at = start + found[0].length;
  }
  if (at < rest.length) spans.push({ text: rest.slice(at), kind: "plain" });

  return spans;
}
