import type { Fault } from "../predictions/checks";
import type { MatchDesk } from "./desk";
import type { ReportsDraft } from "./draft";
import { stringOrEmpty } from "../../untrusted";

// The fan's read-back: a supporter who goes to every match on the page and plays in this league quotes what he would never
// say or believe. He never rewrites; his words would become next week's tics. His flags go back once and never print.

export const FAN_TAGS = ["not so", "not said", "invented", "same again", "said twice", "draft"] as const;

const squash = (text: string) => text.replace(/\s+/gu, " ").trim().toLowerCase();

/** What the fan reads: the headline candidates, then each match's result, figures, table and pieces, labelled. */
export function fanBrief(draft: ReportsDraft, desks: readonly MatchDesk[], headlines: readonly string[]): string {
  const matches = desks
    .flatMap((desk) => {
      const piece = draft.matches.get(desk.match.fixture.code);
      if (piece === undefined) return [];
      const { match } = desk;
      return [
        [
          `MATCH ${match.fixture.code}: ${match.home.name} ${match.fixture.homeScore}-${match.fixture.awayScore} ${match.away.name}.`,
          `Key stats: ${desk.keyStats.map((k) => `${k.label} ${k.value}`).join("; ")}.`,
          `True: ${[desk.standing.home, desk.standing.away].flatMap((s) => s?.lines ?? []).join("; ")}; ${desk.facts.join("; ")}.`,
          `standfirst: ${piece.standfirst}`,
          `account: ${piece.account}`,
          ...piece.sections.map((s, i) => `s${i + 1}: ${s.head}. ${s.pitch} ${s.stake}`),
        ].join("\n"),
      ];
    })
    .join("\n\n");
  const offered = headlines.length === 0 ? "none offered" : headlines.map((h, i) => `${i + 1}. ${h}${draft.meanings?.[h] === undefined ? "" : ` (the writer's two meanings: ${draft.meanings[h]})`}`).join("\n");
  const story = draft.headlineStory === undefined || draft.headlineStory === "" ? "" : `THE STORY they pun on: ${draft.headlineStory}\n`;
  return `${story}HEADLINE CANDIDATES for the day, on the lead match:\n${offered}\n\n${matches}`;
}

/** His flags as send-backs: an unknown part, a quote that is not word for word in it, or one past the cap, is dropped. */
export function fanFaults(raw: Record<string, unknown>, draft: ReportsDraft, cap: number): Fault[] {
  const faults: Fault[] = [];
  const perPart = new Map<string, number>();
  for (const flag of Array.isArray(raw.flags) ? raw.flags : []) {
    if (typeof flag !== "object" || flag === null) continue;
    const f = flag as Record<string, unknown>;
    const code = Number(f.fixture);
    const part = stringOrEmpty(f.part);
    const quote = stringOrEmpty(f.quote);
    const tag = FAN_TAGS.find((t) => t === f.tag) ?? "not said";
    const piece = draft.matches.get(code) ?? { standfirst: "", account: "", sections: [] };
    if (quote.trim() === "" || (part !== "headline" && !draft.matches.has(code))) continue;
    const section = /^s(\d+)$/u.exec(part);
    const text =
      part === "headline" ? draft.headline
      : part === "standfirst" ? piece.standfirst
      : part === "account" ? piece.account
      : section !== null ? (() => { const s = piece.sections[Number(section[1]) - 1]; return s === undefined ? "" : `${s.head}. ${s.pitch} ${s.stake}`; })()
      : "";
    if (!squash(text).includes(squash(quote))) continue;
    const key = part === "headline" ? "headline" : `${code}:${part}`;
    const used = perPart.get(key) ?? 0;
    if (used >= cap) continue;
    perPart.set(key, used + 1);
    faults.push({ section: key, check: `a supporter would not say this: ${tag}`, severity: "send-back", evidence: `"${quote}"${typeof f.why === "string" ? ` (${f.why})` : ""}` });
  }
  return faults;
}

/** The headline the fan chose, by its number, or null when he chose none or named one that is not there. */
export function fanHeadline(raw: Record<string, unknown>, headlines: readonly string[]): string | null {
  const pick = typeof raw.headline === "number" ? raw.headline : null;
  return pick !== null && Number.isInteger(pick) && pick >= 1 && pick <= headlines.length ? headlines[pick - 1] : null;
}
