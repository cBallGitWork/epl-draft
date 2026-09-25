// FPL's availability note, read into what is wrong and what they expect, so a letter can say it
// the way a physio would without adding anything. Five shapes cover all 204 notes counted on
// 25 Sep 2026; anything else is carried whole as `other`.

/** What FPL expects of an injury: a return date, a chance of playing, or no date yet. */
export type Outlook = { back: string } | { chance: number } | "unknown" | null;

export type NoteReading =
  | { kind: "injury"; complaint: string; outlook: Outlook }
  | { kind: "ban"; until: string | null }
  | { kind: "move"; clause: string }
  | { kind: "other"; text: string };

/** One note, read. `Knee injury - Unknown return date` is an injury with no date. */
export function readNote(news: string): NoteReading {
  const text = news.trim().replace(/\s+/g, " ").replace(/\.$/, "");
  const ban = /^suspended(?: until (.+))?$/i.exec(text);
  if (ban) return { kind: "ban", until: ban[1] ?? null };
  if (/^has (joined|departed|returned|left)\b/i.test(text)) {
    return { kind: "move", clause: text.charAt(0).toLowerCase() + text.slice(1) };
  }
  const parts = /^(.+?) - (.+)$/.exec(text);
  if (parts === null) return text === "" ? { kind: "other", text } : { kind: "injury", complaint: text, outlook: null };
  const [, complaint, rest] = parts;
  const back = /^expected back (.+)$/i.exec(rest);
  const chance = /^(\d+)% chance of playing$/i.exec(rest);
  const outlook: Outlook = back
    ? { back: back[1] }
    : chance
      ? { chance: Number(chance[1]) }
      : /^unknown return date$/i.test(rest)
        ? "unknown"
        : null;
  return outlook === null ? { kind: "other", text } : { kind: "injury", complaint, outlook };
}

/** What follows his name: "has a knee injury", "is ill". FPL's own complaint, never a diagnosis of ours. */
export function ailment(complaint: string): string {
  const said = complaint.trim().toLowerCase();
  if (said === "unspecified injury") return "has an injury";
  if (said === "illness") return "is ill";
  if (said.startsWith("lack of ")) return `is short of ${said.slice("lack of ".length)}`;
  if (said.includes("personal")) return "is away for personal reasons";
  return `has ${/^[aeiou]/.test(said) ? "an" : "a"} ${said}`;
}
