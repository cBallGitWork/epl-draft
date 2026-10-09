import { recordOrEmpty } from "../untrusted";

// The Team Sheet's own send-back: a club written up as who did not speak, or what was not said, is no team news.

/** Writing about absent managers and absent news instead of footballers, and forecasting who starts. */
export const NEWS_GAPS: readonly string[] = [
  "no manager", "put his name to", "put their name to", "attached to the update", "attached to the news",
  "was attached", "no fresh", "no word", "no news", "nothing new", "no update", "no new update", "nothing added",
  "nothing more", "no change", "all that was said", "no complaint", "left open",
  "leaves open", "leaves it open", "whether he starts", "whether he will start", "did not speak", "nobody spoke",
  "no one spoke", "said nothing",
];

/** A FIT man's note says what he is back from, or nothing: "back from a muscle injury", never a bare "muscle". */
const BACK_FROM = /^(back|returns?|returned|recovered|over)\b/iu;

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
