import { recordOrEmpty } from "../untrusted";
import type { TeamSheetExpect } from "./briefs/presserClubs";

// The Team Sheet's own send-back: a club written up as who did not speak, or what was not said, is no team news.

/** Writing about absent managers and absent news instead of footballers, and forecasting who starts. */
export const NEWS_GAPS: readonly string[] = [
  "no manager", "put his name to", "put their name to", "attached to the update", "attached to the news",
  "was attached", "no fresh", "no word", "no news", "nothing new", "no update", "no new update", "nothing added",
  "nothing more", "no change", "all that was said", "no complaint", "left open",
  "leaves open", "leaves it open", "whether he starts", "whether he will start", "did not speak", "nobody spoke",
  "no one spoke", "said nothing",
];

/** A FIT man's note says what he is back from or what has changed, never a bare "muscle". */
const BACK_FROM = /^(back|returns?|returned|recovered|over|trained|training|ready|cleared|rejoined)\b/iu;

/** The FIT men whose note is a complaint with no "back from", which prints as if he still has it. */
export function unbackedFit(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    const { men } = recordOrEmpty(row);
    if (!Array.isArray(men)) return [];
    return men.flatMap((man) => {
      const { name, status, note } = recordOrEmpty(man);
      const bare = status === "FIT" && typeof note === "string" && note.trim() !== "" && !BACK_FROM.test(note.trim());
      return bare && typeof name === "string" ? [name] : [];
    });
  });
}

/** The statuses a note must explain; a ban needs no more than the word. */
const NOTED: ReadonlySet<string> = new Set(["FIT", "OUT", "Doubt"]);

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** What the filed rows left out that the brief gave them: a club's line, a club's quote, a man's note. */
export function teamSheetGaps(rows: unknown, expected: TeamSheetExpect): { lines: string[]; quotes: string[]; notes: string[] } {
  const filed = (Array.isArray(rows) ? rows : []).map(recordOrEmpty);
  const rowOf = (club: { code: number; club: string }) =>
    filed.find((row) => row.code === club.code) ?? filed.find((row) => row.club === club.club);
  const missing = (clubs: TeamSheetExpect["reported"], has: (row: Record<string, unknown>) => boolean) =>
    clubs.filter((club) => {
      const row = rowOf(club);
      return row === undefined || !has(row);
    }).map((club) => club.club);
  const owed = new Set(expected.noted);
  return {
    lines: missing(expected.reported, (row) => text(row.line) !== ""),
    quotes: missing(expected.quoted, (row) => text(recordOrEmpty(row.quote).text) !== ""),
    notes: filed
      .flatMap((row) => (Array.isArray(row.men) ? row.men.map(recordOrEmpty) : []))
      .filter((man) => typeof man.name === "string" && owed.has(man.name) && NOTED.has(String(man.status)) && text(man.note) === "")
      .map((man) => String(man.name)),
  };
}
