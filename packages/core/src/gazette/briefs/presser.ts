import type { PresserQuote, PresserSignal } from "../../football/intel/pressers";
import { FIRM } from "../../football/intel/pressers";
import { groupedBy } from "../../grouped";
import { storylinesBlock } from "./storylines";
import type { StoryThread } from "../ledger";
import { briefOf } from "./briefOf";

// The team news brief: what managers said about availability, by club, owned or not.

/** One signal, plus what the export cannot carry: the player's name and whose problem he is. */
export interface PresserLine extends PresserSignal {
  playerName: string;
  /** His Premier League club, for the row he belongs on and its crest. */
  clubName: string;
  /** The manager in our league who owns him, or null; never a filter, as an unowned man can be claimed. */
  ownerName: string | null;
  /** Whether his availability changed around this conference, from FPL's `newsAdded`; false is a standing absence. */
  fresh: boolean;
}

/** Each tag in the words the column may use, so the model never invents one for `managed_load`. */
const MEANS: Record<string, string> = {
  ruled_out: "OUT — he does not play",
  suspended: "SUSPENDED — banned, not injured",
  available: "FIT again — back in contention",
  rotation_risk: "may be rotated",
  managed_load: "his minutes are being managed",
  injury_scare: "a doubt",
};

/** The tags that keep a man out of the side; a standing doubt or rotation risk is not an absence. */
const ABSENT: ReadonlySet<string> = new Set(["ruled_out", "suspended"]);

/** A standing absence: out, and nothing new said about it. Neither a bullet nor still out is a standing doubt. */
export const stillOut = (line: PresserLine) => !line.fresh && ABSENT.has(line.tag);

/** The speaker's name, or null where the export named nobody ("" on a row, null on a conference). */
const speaker = (manager: string | null) => (manager === null || manager.trim() === "" ? null : manager);

export function buildPresserBrief(brief: {
  gameweek: number;
  /** Newest first, and every man mentioned — not only the ones we hold. */
  lines: readonly PresserLine[];
  /** What the managers said, verbatim; absent on an older export, and the column runs without them. */
  quotes?: readonly (PresserQuote & { clubName: string })[];
  /** The man the desk has chosen to print, so the prose and the picture agree. */
  lead?: string | null;
  /** Every club that held a conference, including those with nothing to report. */
  spoke?: readonly { clubName: string; manager: string | null }[];
  threads: readonly StoryThread[];
}): string {
  // By club: the unit the news arrives in and a reader scans.
  const byClub = new Map<string, { code: number; lines: PresserLine[] }>();
  for (const line of brief.lines) {
    const row = byClub.get(line.clubName) ?? { code: line.club, lines: [] };
    row.lines.push(line);
    byClub.set(line.clubName, row);
  }

  const clubs = [...byClub.entries()].map(([club, row]) => {
    // The men whose availability CHANGED get bullets; a standing absence is a tail line.
    const standing = row.lines.filter(stillOut);
    const men = row.lines.filter((line) => line.fresh).map((line) => {
      // The owner in brackets after the name, never a clause.
      const who = line.ownerName === null ? "" : ` (${line.ownerName})`;
      const soft = line.confidence >= FIRM ? "" : " [HINT, not a fact]";
      // An absent complaint is stated, or the model borrows the one above; a fit man is back FROM his, never still in it.
      const known = line.condition !== undefined && line.condition !== "";
      const what =
        line.tag === "available"
          ? known ? `FIT again — back from ${line.condition}` : MEANS.available
          : `${MEANS[line.tag] ?? line.tag}${known ? ` (${line.condition})` : " (COMPLAINT NOT STATED — you may not name one)"}`;
      // The export writes "" or null for a conference with no named speaker: offer nobody rather than a gap.
      const by = speaker(line.manager) === null ? "" : `, said by ${line.manager}`;
      return `${line.playerName}${who} — ${what}${by}${soft}`;
    });
    const also =
      standing.length === 0
        ? ""
        : `\n  STILL OUT: ${standing.map((line) => line.playerName).join(", ")}`;
    return `- ${club} (code ${row.code}):${men.length === 0 ? "" : ` ${men.join(" · ")}`}${also}`;
  });

  const owned = brief.lines.filter((line) => line.ownerName !== null).length;

  // Clubs that held a conference and named nobody still get a row, so they are not an apparent oversight.
  const quiet = (brief.spoke ?? [])
    .filter((each) => !byClub.has(each.clubName))
    .map((each) => `- ${each.clubName}${speaker(each.manager) === null ? "" : ` (${each.manager})`}`);

  // Grouped by club so the writer sees a club's words beside its players.
  const line = (quote: PresserQuote) => `  "${quote.text}" — ${quote.said}${quote.about === undefined ? "" : ` on ${quote.about}`}`;
  const said = [...groupedBy(brief.quotes ?? [], (quote) => quote.clubName)].map(([club, quotes]) => [`- ${club}:`, ...quotes.map(line)].join("\n"));

  return briefOf([
    `TEAM NEWS, gameweek ${brief.gameweek}. What the managers said before the deadline. A draft manager reads this to decide who to start AND who to claim, so it covers every man mentioned, not only the ones somebody owns.`,
    [`WHAT WAS SAID, by club — ${brief.lines.length} men across ${byClub.size} clubs, ${owned} of them owned in this league. The code is the club's and you must echo it back exactly:`, ...clubs].join("\n"),
    quiet.length === 0
      ? null
      : [
          "THESE CLUBS NAMED NO MAN AS OUT, DOUBTFUL OR BACK. Each gets a row with an empty \"men\" list and a line of football: \"No injury concerns.\", or the fact its quote below carries. Do NOT invent a player for them, and do not leave them out:",
          ...quiet,
        ].join("\n"),
    [
      'RETURN A ROW PER CLUB in "teamNews", in this shape:',
      '  { "club": the club name exactly as given,',
      '    "code": the number given on that line,',
      '    "line": ONE sentence of football — who is out, who is back, what was decided — and nothing that repeats a bullet or the STILL OUT list, which the page prints under it; where the club has nothing beyond those lists, leave "line" empty (""),',
      '    "men": [ { "name": his name as given, "owner": our manager who holds him or omit it, "status": one of OUT | Doubt | Suspended | FIT, "note": the complaint and what was said, a few words — and where a ban or an absence has a KNOWN LENGTH, that length is the most useful thing you can put here } ],',
      '    "quote": { "text": his words EXACTLY as given below, "said": who said them } — or omit it when the club has none }',
    ].join("\n"),
    "A FIT MAN'S NOTE BEGINS \"back from\": \"back from a muscle injury\". A bare \"muscle\" under FIT reads as if he still has it. Where you were given nothing he is back from, leave the note empty; never a note about the brief.",
    "WRITE FOOTBALL, NEVER THE PRESS CONFERENCE. A club's line and the body say who is out, who is back and what was decided. Never write about who spoke or who did not, whose name is on the news, what was or was not said, or that a club has nothing to add: where a club named nobody new, leave \"line\" empty, as its lists say it. And never forecast who starts.",
    "NEVER NAME AN INJURY YOU WERE NOT GIVEN. Where a man's line says COMPLAINT NOT STATED, his note says what was said about him and nothing about his body — \"a doubt\", \"not cleared\", \"decision Friday\". Borrowing the complaint from the man above him is the worst error this column can make, and it has made it.",
    "NEVER RESTATE THE STATUS IN THE NOTE. \"OUT — not able to play\", \"FIT — back in contention\", \"Suspended — banned, not injured\" are the tag written twice; the second half is deleted by any sub who sees it. The note carries the COMPLAINT and anything the tag cannot say — how long, since when, what happens next. Where there is nothing to add, leave the note empty.",
    "A QUOTE THAT SAYS NOTHING GETS NO SPACE. \"More or less the same as the other night, yeah, nothing has really changed\" is a man declining to give you news, and printing it gives six lines to an absence. Use a quote only where it carries a fact the bullets do not — a timescale, a reason, a decision. Otherwise omit it.",
    'THE MEN UNDER "STILL OUT" GET NO BULLET. They are a standing condition a reader already knows — out for weeks, nothing said today — and the desk lists them under the club itself, so leave them out of your row. 86% of a day\'s men are these; bulleting them buries the seven that are news.',
    "ONE BULLET PER MAN who changed, and every one of them gets one. The note is a FEW WORDS, not a sentence: \"calf; closer to a return\", \"hamstring; out until after the break\", \"injury unconfirmed, could still feature\". No verb of attribution in a bullet — the club\'s line carries the manager, the bullets carry the facts.",
    "NAME THE COMPLAINT. Where a man's trouble is given in brackets — calf, ankle, concussion — say it. 'Carrying a knock' when the brief told you it is a hamstring is the column throwing away the one fact a reader came for.",
    "BRITISH ENGLISH, AND PLAIN. Write as a UK football reporter writes. No Americanisms and no invented idiom — \"Newcastle read heaviest\" is not a sentence anybody has said, and it went to print. If a phrase would look odd in a newspaper, it is odd.",
    "DO NOT SAY \"KNOCK\". It appeared eight times in one column. Say what it actually is — a calf, a hamstring, an ankle — and where the brief names none, say he is a doubt, is being assessed, or was not cleared. Never the same word twice in a row either.",
    "THE OWNER IS A FIELD, NOT PROSE. Put our manager in \"owner\" and never write \"owned by\" or a clause about him.",
    "NO TWO CLUB LINES ALIKE. Six clubs opening \"[Manager] confirms…\" is the tell that nobody wrote it. A manager says, plays down, confirms, rules out.",
    brief.lead === undefined || brief.lead === null
      ? null
      : `THE LEAD IS ${brief.lead.toUpperCase()}, and that is the desk's decision rather than yours. His photograph runs beside this column, so the DECK must name him and the opening sentence must be about him and what was said about him. A deck naming four other men under his picture is the page contradicting itself.`,
    "THE BODY IS ABOUT THE LEAD MAN AND NOBODY ELSE. At most two sentences: what was said about him — his status, his complaint, any timescale or decision. One fact is one sentence. It must NOT survey the other clubs, count them, or characterise their news — the rows below do all of that, and every attempt to summarise them has produced filler a sub-editor deleted. If you find yourself writing a sentence that mentions three clubs, delete it.",
    "CALL A CLUB WHAT THE BRIEF CALLS IT. \"Brighton & Hove Albion\", never \"the Seagulls\"; \"Nottingham Forest\", never \"Forest's Tricky Trees\". A nickname is colour you were not given and it reads as a fan writing, not a reporter.",
    "NO SCENE-SETTING, IN THE BODY OR IN A CLUB'S LINE. \"Elsewhere the picture is harder\", \"long absence lists\", \"reads heaviest\", \"a mixed bag\" describe the SHAPE OF YOUR OWN COLUMN to a reader looking straight at it. Every sentence starts on a footballer or a manager.",
    "NO VERDICT ON THE DAY, AND NO WEATHER REPORT. Never rank clubs by how good or bad their news was. \"Forest bring the day's better news\", \"Newcastle carry the heaviest load\", \"the one clear gain\", \"reads heaviest\" — all of that is you editorialising about a list you were handed, and it is the first thing a reader skips. Say who is out and who is back. The reader decides whether that is good news.",
    "DO NOT NAME THE MANAGER TWICE. If the club's quote carries his name, the club's line must not also open with it — write what was established, not who established it. Name him in the line only where that club has no quote.",
    said.length === 0
      ? "YOU HAVE NO QUOTES AND MUST NOT WRITE ONE. Report the meaning; never a sentence in quotation marks."
      : [
          "WHAT THEY ACTUALLY SAID — verbatim, and you may print these. Use ONE per club at most, in double quotation marks, with the manager's name after it. Copy the words EXACTLY; never tidy, shorten or join two quotes. Trim to a sentence if it is long, and never change a word of what is left. A club with no quote below simply has none, and you must NOT write one for it:",
          ...said,
        ].join("\n"),
    "A HINT IS A HINT. Where a line is marked HINT, write it as one — 'suggested', 'did not rule out', 'stopped short of'. Never promote it to a fact.",
    "NO ADVICE, and no narrative about our managers. Name the owner; do not tell him what to do, or discuss his week.",
    storylinesBlock(brief.threads),
  ]);
}
