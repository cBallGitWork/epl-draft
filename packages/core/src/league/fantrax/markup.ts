// Fantrax nests markup in its strings (`<b>D</b>: 2`, `BOU<br/>Sun 9:00AM`), and none may reach a template.

/** Provider text as one line: tags become spaces, runs of space collapse, and nothing left is null. */
export function plainText(value: string | undefined): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text === "" ? null : text;
}
