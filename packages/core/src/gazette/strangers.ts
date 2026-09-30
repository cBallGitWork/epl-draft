// The check that catches a man who was never in the brief.
//
// **The failure it is written against**, from `voice/house.ts`'s own preamble:
// handed a squad, a model invents a centre-back; handed a name with an initial
// it substitutes the famous player with that surname. None of it is fixable
// downstream, because every one of them reads perfectly.
//
// `house` states the rule — NAMES ARE EXACT, never substitute a more famous
// player with the same surname — and a rule the model can obey to the letter
// while still naming a man it was not given is not a guardrail; it is a hope.
// So the check is mechanical and runs after the words come back.
//
// **It is a warning and never a refusal, and 2 Sep 2026 is why.** The first
// story this paper ever filed named Dedić, and a hand-check against a
// reconstructed brief said he was invented — he is a real Newcastle defender
// and there is no Dedić in the roster captures. He was in the team of the week
// all along: the eleven is computed from LIVE data joined to rosters, the
// brief had moved between one firing and the next, and the story was correct.
// A correction was made to the filed prose and then reverted from the archive.
// An eager check a human reads is useful; an eager check that refuses a story
// would have thrown away a true one.
//
// Pure by construction: it is handed the prompt and the prose and compares
// them. No clock, no network, no roster read — the brief is already the list
// of everyone who may be named, which is precisely what makes it checkable.

/** Words that open a sentence or a proper noun and are never a person here.
 *  Kept deliberately small: a false NEGATIVE costs a caught hallucination, and
 *  a false POSITIVE only costs a warning line a human then reads. */
const NOT_A_NAME = new Set([
  // Sentence openers and connectives that appear capitalised mid-prose.
  "A", "An", "And", "As", "At", "Across", "After", "All", "Already", "Also",
  "Another", "Any", "Are", "Around", "Away",
  "Back", "Beating", "Best", "Both", "Both", "But", "By",
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
  "Full", "Premier", "League", "Saturday", "Sunday", "Monday", "Tuesday",
  "Wednesday", "Thursday", "Friday",
]);

/** A capitalised word, including accented letters and internal hyphens or
 *  apostrophes, so "Gibbs-White", "Groß", "João" and "O'Riley" survive whole. */
const CAPITALISED = /\p{Lu}[\p{L}'’]*(?:[-–]\p{Lu}[\p{L}'’]*)*/gu;

/** Capitalised tokens, with any possessive ending removed: a paper writes
 *  "Tarkowski's goal" about the Tarkowski the brief named, and the apostrophe
 *  is grammar rather than a different man. */
function words(text: string): string[] {
  return (text.match(CAPITALISED) ?? []).map((word) => word.replace(/['’]s$/u, ""));
}

/** Every capitalised token the prompt contains, plus each part of a hyphenated
 *  or dotted name — the brief may print "B.Fernandes" where the prose writes
 *  "Fernandes", and that is the same man being referred to correctly. */
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

/** Capitalised words in the prose that the brief never mentioned.
 *
 *  Do NOT pass a headline to this: a headline is title-case by construction, so
 *  every ordinary word in it reports as a stranger. The caller checks the body,
 *  the deck and the tie lines, which are sentence-case and where a fabricated
 *  footballer actually does his damage.
 *
 *  Returns names, not a verdict: the caller decides whether an unknown name is
 *  worth refusing over, and a human reads the list either way. Everything in
 *  `NOT_A_NAME` and every single letter is dropped, so an initial or a sentence
 *  opener never reports as a stranger. */
export function strangers(prose: string, brief: string): string[] {
  const known = namesInBrief(brief);
  const found = new Set<string>();
  for (const word of words(prose)) {
    if (word.length < 2) continue;
    if (NOT_A_NAME.has(word)) continue;
    if (known.has(word)) continue;
    // A hyphenated name is known if every part of it is.
    const parts = word.split(/[-–]/);
    if (parts.length > 1 && parts.every((p) => known.has(p))) continue;
    // A word immediately before a known surname is that man's forename: the
    // brief prints "B.Fernandes" and a paper writes "Bruno Fernandes", which
    // is the same person correctly named. Only report it when the surname
    // beside it is ALSO unknown — that is a whole stranger rather than a
    // fuller spelling of somebody we were given.
    if (nextTo(prose, word, known)) continue;
    // **Only ever at the start of a sentence, and never anywhere else.** A
    // stop-list of openers ("Elsewhere", "Losing", "Across") is a list that
    // will always lag the prose, so the shape is checked instead: a word that
    // appears exclusively after a full stop is doing a sentence opener's job.
    // A footballer the brief never named turns up mid-sentence too, because
    // that is where a paper reports what he did.
    if (alwaysOpensASentence(prose, word)) continue;
    found.add(word);
  }
  return [...found].sort();
}

/** Whether every occurrence of `word` sits directly before a name the brief
 *  gave us. Used to forgive a forename attached to a known surname without
 *  forgiving an unknown word that merely appears once in good company. */
function nextTo(prose: string, word: string, known: Set<string>): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const pattern = new RegExp(`${escaped}[\\s]+(\\p{Lu}[\\p{L}'’-]*)`, "gu");
  const after = [...prose.matchAll(pattern)].map((match) => match[1].replace(/['’]s$/u, ""));
  return after.length > 0 && after.every((next) => known.has(next));
}

/** Whether every occurrence of `word` sits at the start of a sentence — after
 *  a full stop, or at the very beginning of a line. A name that never once
 *  appears mid-sentence is almost certainly a capitalised ordinary word. */
function alwaysOpensASentence(prose: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const every = [...prose.matchAll(new RegExp(escaped, "gu"))];
  if (every.length === 0) return false;
  return every.every((match) => {
    const before = prose.slice(0, match.index).trimEnd();
    // A newline opens a sentence as surely as a full stop does: each rank line
    // and each tie line arrives as its own line, and the first word of one is
    // in exactly the position "Elsewhere" or "Top" occupies.
    const line = prose.slice(0, match.index);
    const opens =
      before === "" || /[.!?:]$/u.test(before) || /\n[ \t]*$/u.test(line);
    if (!opens) return false;
    // An opener is only forgiven when what follows could not be a surname:
    // a lowercase word, a digit, or a hyphenated continuation. "Losing to
    // test4 by 11", "Fifty-six to 45" and "Sits 76 to 35" all open sentences;
    // "Dedić kept a clean sheet" opens with a man. The distinction is whether
    // the NEXT token could be the rest of a name.
    const after = prose.slice(match.index + word.length);
    return /^[-–]|^\s*[\p{Ll}\d]/u.test(after);
  });
}
