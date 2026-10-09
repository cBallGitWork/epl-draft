import { DRAFT_WRITING } from "../../config";
import { banned } from "../banned";
import { escapeRegExp } from "../../regExp";
import { masked, numbersIn, sentences } from "../predictions/prose";
import { londonWeekdayLong, weekdayLongOfDay } from "../../time";
import { recordOrEmpty, stringOrEmpty } from "../../untrusted";
import type { MatchupContext } from "./brief";
import { allowedFigures } from "./checks";
import { menOf, named, unbriefedNames } from "./listChecks";
import { DRAFT_NEVER } from "./words";
import type { DraftPiece } from "./writing";

// The last read before print: the fact checker quotes each claim its block does not bear and offers the sentence put
// right. A correction is kept only if it passes the writer's own checks; otherwise the claim is cut, since a wrong fact
// is worse than a shorter report. Pure.

interface FactFix {
  matchup: number;
  quote: string;
  /** The quote put right from the block; empty when it cannot be, and it is cut. */
  correction: string;
}

/** The words a paper may put before a man for his position, by slot, the plain one first. */
const POSITIONS: Record<string, readonly string[]> = {
  G: ["goalkeeper", "keeper"],
  D: ["defender", "centre-back", "full-back", "left-back", "right-back", "wing-back"],
  M: ["midfielder", "winger"],
  F: ["forward", "striker", "winger"],
};
const WEEKDAYS = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gu;

/** The fixes the desk can make without a model: a position word that is not a man's is put right ("Everton defender
 *  Jordan Pickford"), and a sentence that puts a man on a day he did not play is cut. */
export function knownFixes(pieces: ReadonlyMap<number, DraftPiece>, contexts: readonly MatchupContext[]): FactFix[] {
  const words = Object.values(POSITIONS).flat().join("|");
  return [...pieces].flatMap(([matchup, piece]) => {
    const ctx = contexts[matchup - 1];
    if (ctx === undefined) return [];
    const men = menOf(ctx);
    const out: FactFix[] = [];
    const prose = piece.paragraphs.join("\n");
    for (const { man, names } of men) {
      const surname = names.at(-1) ?? man.name;
      // No letter after the surname, where `\b` would miss one ending "ß" or "ć".
      for (const hit of prose.matchAll(new RegExp(`\\b(${words})\\s+((?:\\p{Lu}[\\p{L}'.-]*\\s+)?${escapeRegExp(surname)})(?![\\p{L}\\p{N}])`, "gu"))) {
        const allowed = POSITIONS[man.slot];
        if (allowed !== undefined && !allowed.includes(hit[1].toLowerCase())) out.push({ matchup, quote: hit[0], correction: `${allowed[0]} ${hit[2]}` });
      }
    }
    for (const sentence of sentences(prose)) {
      const days = [...new Set([...sentence.matchAll(WEEKDAYS)].map((d) => d[1]))];
      if (days.length !== 1) continue;
      // Cut only when the day is none of its dated men's: "Haaland answered Saka on Sunday" is Haaland's Sunday.
      const dated = named(sentence, men).flatMap(({ man }) => {
        const his = [...man.byDay.map((d) => weekdayLongOfDay(d.day)), ...(man.next === null ? [] : [londonWeekdayLong(man.next.kickoff)])];
        return his.length === 0 || ctx.state.home.subs.concat(ctx.state.away.subs).some((s) => s.in === man) ? [] : [his];
      });
      if (dated.length > 0 && dated.every((his) => !his.includes(days[0]))) out.push({ matchup, quote: sentence, correction: "" });
    }
    return out;
  });
}

/** The fact checker's JSON as fixes; anything misshapen is dropped. */
export function readFactFixes(raw: Record<string, unknown>): FactFix[] {
  return (Array.isArray(raw.fixes) ? raw.fixes : []).flatMap((f): FactFix[] => {
    const r = recordOrEmpty(f);
    const quote = stringOrEmpty(r.quote).trim();
    const matchup = Number(r.number);
    return quote === "" || !Number.isInteger(matchup) ? [] : [{ matchup, quote, correction: stringOrEmpty(r.correction).trim() }];
  });
}

/** Whether a correction may print: no banned phrase, no figure its block does not give, no first name from memory. */
function sound(text: string, ctx: MatchupContext, block: string): boolean {
  // Men and sides are names, never words or figures: "test2" is no 2.
  const sides = [ctx.state.home.side.name, ctx.state.away.side.name, ...[ctx.next.home, ctx.next.away].flatMap((x) => x?.name ?? [])];
  const plain = masked(text, [...menOf(ctx).flatMap((m) => m.names), ...sides]).replace(/\u0000/gu, " ");
  const allowed = allowedFigures(ctx, block);
  return banned(plain, DRAFT_NEVER).length === 0 && numbersIn(plain).every((n) => allowed.has(n)) && unbriefedNames(text, ctx, block).length === 0;
}

/** The writing with each fix made, `factFixes` at most a match-up: a sound correction in place of its quote, or the quote
 *  cut; a paragraph left empty goes. */
export function applyFactFixes(pieces: ReadonlyMap<number, DraftPiece>, fixes: readonly FactFix[], contexts: readonly MatchupContext[], blocks: readonly string[]): { pieces: Map<number, DraftPiece>; made: number } {
  const out = new Map([...pieces].map(([n, p]) => [n, { paragraphs: [...p.paragraphs] }]));
  const done = new Map<number, number>();
  let made = 0;
  for (const fix of fixes) {
    const piece = out.get(fix.matchup);
    const ctx = contexts[fix.matchup - 1];
    const at = piece?.paragraphs.findIndex((p) => p.includes(fix.quote)) ?? -1;
    if (piece === undefined || ctx === undefined || at < 0 || (done.get(fix.matchup) ?? 0) >= DRAFT_WRITING.factFixes) continue;
    const block = blocks[fix.matchup - 1] ?? "";
    const line = fix.correction !== "" && sound(fix.correction, ctx, block) ? fix.correction : "";
    piece.paragraphs[at] = piece.paragraphs[at].replace(fix.quote, line).replace(/\s{2,}/gu, " ").trim();
    piece.paragraphs = piece.paragraphs.filter((p) => p !== "");
    done.set(fix.matchup, (done.get(fix.matchup) ?? 0) + 1);
    made++;
  }
  return { pieces: out, made };
}
