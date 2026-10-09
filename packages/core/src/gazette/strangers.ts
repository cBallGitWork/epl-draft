import { escapeRegExp } from "../regExp";

// Names in the prose the brief never gave: a warning a human reads, never a refusal, since an eager check can be wrong.

/** Capitalised words that are never a person here; kept small, as a miss costs more than a spare warning. */
const NOT_A_NAME = new Set([
  // Sentence openers and connectives that appear capitalised mid-prose.
  "A", "An", "And", "As", "At", "Across", "After", "All", "Already", "Also",
  "Another", "Any", "Are", "Around", "Away",
  "Back", "Beating", "Best", "Both", "But", "By",
  "Down", "Dropping", "During",
  "Each", "Elsewhere", "Even", "Every", "Everything",
  "First", "For", "Four", "From", "Full",
  "He", "Her", "Here", "His", "How", "However",
  "If", "In", "Into", "Is", "It", "Its",
  "Just",
  "Last", "Leading", "Left", "Losing",
  "More", "Most",
  "Never", "New", "Next", "Nine", "No", "Nobody", "None", "Not", "Nothing", "Now",
  "Of", "On", "One", "Only", "Or", "Others", "Out", "Over",
  "Past", "Perhaps", "Playing", "Pointless",
  "Right",
  "Scoring", "Second", "Seven", "She", "Since", "Six", "So", "Some", "Still",
  "Ten", "That", "The", "Their", "Them", "Then", "There", "These", "They",
  "Third", "This", "Those", "Three", "Through", "To", "Two",
  "Under", "Until", "Up",
  "West", "What", "When", "Where", "Which", "While", "Who", "Whose", "With",
  "Watching", "Winning", "Yet", "You", "Your",
  // Football furniture that is capitalised but is not a person.
  "Premier", "League", "Saturday", "Sunday", "Monday", "Tuesday",
  "Wednesday", "Thursday", "Friday", "BBC",
  // A columnist's first person: "I" alone is under two letters and never reported.
  "I'm", "I've", "I'll", "I'd",
]);

/** A capitalised word, whole through accents, hyphens and apostrophes: "Gibbs-White", "João", "O'Riley". */
const CAPITALISED = /\p{Lu}[\p{L}'’]*(?:[-–]\p{Lu}[\p{L}'’]*)*/gu;

/** Capitalised tokens with any possessive "'s" removed. */
function words(text: string): string[] {
  return (text.match(CAPITALISED) ?? []).map((word) => word.replace(/['’]s$/u, ""));
}

/** Every capitalised token in the brief, plus each part of a hyphenated or dotted name ("B.Fernandes"). */
function namesInBrief(brief: string): Set<string> {
  const known = new Set<string>();
  for (const word of words(brief)) {
    known.add(word);
    for (const part of word.split(/[-–.]/)) if (part !== "") known.add(part);
  }
  // The brief spells names with initials and punctuation the prose drops.
  for (const part of brief.split(/[\s,()[\]]+/)) {
    for (const bit of part.split(/[-–.]/)) {
      if (bit !== "" && /^\p{Lu}/u.test(bit)) known.add(bit);
    }
  }
  return known;
}

/** Capitalised words in the prose the brief never mentioned, as names, not a verdict.
 *  Never pass a headline: title case reports every ordinary word in it. */
export function strangers(prose: string, brief: string): string[] {
  const known = namesInBrief(brief);
  const found = new Set<string>();
  for (const word of words(prose)) {
    if (word.length < 2) continue;
    if (NOT_A_NAME.has(word.replace(/’/gu, "'"))) continue;
    if (known.has(word)) continue;
    // A hyphenated name is known if every part of it is.
    const parts = word.split(/[-–]/);
    if (parts.length > 1 && parts.every((p) => known.has(p))) continue;
    // A word always before a known surname is his forename: "Bruno" beside the brief's "B.Fernandes".
    if (nextTo(prose, word, known)) continue;
    // A word that only ever opens a sentence is an opener; a stranger turns up mid-sentence too.
    if (alwaysOpensASentence(prose, word)) continue;
    found.add(word);
  }
  return [...found].sort();
}

/** Whether every occurrence of `word` sits directly before a name the brief gave. */
function nextTo(prose: string, word: string, known: Set<string>): boolean {
  const pattern = new RegExp(`${escapeRegExp(word)}[\\s]+(\\p{Lu}[\\p{L}'’-]*)`, "gu");
  const after = [...prose.matchAll(pattern)].map((match) => match[1].replace(/['’]s$/u, ""));
  return after.length > 0 && after.every((next) => known.has(next));
}

/** Whether every occurrence of `word` opens a sentence or a line and is followed by something no surname could be. */
function alwaysOpensASentence(prose: string, word: string): boolean {
  const every = [...prose.matchAll(new RegExp(escapeRegExp(word), "gu"))];
  if (every.length === 0) return false;
  return every.every((match) => {
    const before = prose.slice(0, match.index).trimEnd();
    // A newline opens a sentence too: rank and tie lines each arrive on their own line.
    const line = prose.slice(0, match.index);
    const opens =
      before === "" || /[.!?:]$/u.test(before) || /\n[ \t]*$/u.test(line);
    if (!opens) return false;
    // Forgiven only when a lowercase word, a digit or a hyphen follows: "Sits 76 to 35", never "Dedić kept".
    const after = prose.slice(match.index + word.length);
    return /^[-–]|^\s*[\p{Ll}\d]/u.test(after);
  });
}
