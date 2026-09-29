/** "A, B and C" or "A, B or C": a list as a sentence carries it. */
export function listed(list: readonly string[], word: "and" | "or"): string {
  return list.length <= 1 ? (list[0] ?? "") : `${list.slice(0, -1).join(", ")} ${word} ${list.at(-1)}`;
}

/** "Dons'", "Notemail's". */
export const possessive = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);
