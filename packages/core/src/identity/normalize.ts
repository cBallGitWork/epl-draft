// Turning two providers' spellings of the same footballer into something
// comparable. Pure string work, no matching decisions — those live in match.ts.

/** Letters NFKD cannot decompose, because the mark is part of the glyph rather
 *  than a combining character: a stroke (Ø, Đ, Ł), a ligature (ß, Æ, Œ), or a
 *  distinct letter (ı, ð, þ).
 *
 *  Without this table they are STRIPPED rather than folded — "Ødegaard"
 *  normalises to "degaard" and "Groß" to "gro", so a provider writing the ASCII
 *  spelling never matches the accented one. Learned the hard way in the sibling
 *  project; ported rather than rediscovered. */
const LETTER_FOLD: Record<string, string> = {
  ø: "o",
  đ: "d",
  ð: "d",
  ł: "l",
  ı: "i",
  ß: "ss",
  æ: "ae",
  œ: "oe",
  þ: "th",
};

/** Casefold, strip diacritics, reduce to letters, digits and single spaces. */
export function normalizeName(name: string): string {
  const folded = name
    .toLowerCase()
    .replace(/[øđðłıßæœþ]/g, (char) => LETTER_FOLD[char] ?? char);

  return folded
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // combining marks, now detached by NFKD
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Split a normalised name into its parts, empty parts discarded. */
export function tokens(name: string): string[] {
  const normalized = normalizeName(name);
  return normalized === "" ? [] : normalized.split(" ");
}

/** The last token of a name — the surname, for every case we actually face.
 *
 *  Used as a guard, not as an identifier: a candidate that contains another
 *  name's tokens must at least share this one before we believe the match. */
export function surname(name: string): string {
  return tokens(name).at(-1) ?? "";
}

/** Every spelling of an FPL player another provider might reasonably use.
 *
 *  FPL splits names inconsistently — "Gabriel Fernando" / "de Jesus" for a player
 *  everyone else calls Gabriel Jesus, and a `webName` that is sometimes a bare
 *  surname ("Raya") and sometimes an initialised form ("B.Fernandes"). Generating
 *  the variants is what lets an exact match succeed far more often than it
 *  otherwise would, which keeps fuzzy matching for the cases that need it. */
export function fplNameVariants(player: {
  firstName: string;
  secondName: string;
  webName: string;
}): string[] {
  const first = normalizeName(player.firstName);
  const second = normalizeName(player.secondName);
  const web = normalizeName(player.webName);
  const initial = first.slice(0, 1);

  const variants = [
    `${first} ${second}`,
    second,
    web,
    initial === "" ? "" : `${initial} ${second}`,
  ];

  return [...new Set(variants.map((variant) => variant.trim()).filter((v) => v !== ""))];
}
