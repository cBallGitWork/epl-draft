// Two providers' spellings of one footballer made comparable: string work only, the decisions are match.ts's.

/** Letters NFKD cannot decompose (Ø, ß, ı): without this they are stripped, and "Ødegaard" becomes "degaard". */
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

/** Casefold, strip diacritics, reduce to letters, digits and single spaces. Apostrophes are deleted, not spaced,
 *  so Fantrax's "OBrien" and FPL's "O'Brien" both read "obrien". */
export function normalizeName(name: string): string {
  const folded = name
    .toLowerCase()
    .replace(/[’'`´]/g, "")
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

/** The last token of a name: a guard a containing candidate must share, never an identifier. */
export function surname(name: string): string {
  return tokens(name).at(-1) ?? "";
}

/** Every spelling of an FPL player another provider might use, so more matches are exact and fewer fuzzy. */
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
