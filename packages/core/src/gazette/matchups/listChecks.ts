import { DRAFT_WRITING } from "../../config";
import { banned, escapeRegExp } from "../banned";
import type { Fault } from "../predictions/checks";
import { masked, mentionAt, ngrams, numbersIn, sentences } from "../predictions/prose";
import { surname } from "../reports/keyStats";
import type { Cutoff, MatchupContext } from "./brief";
import { everyMan } from "./state";
import { SIDES, beatLabel, beatOf, timeline } from "./timeline";
import { DRAFT_FORECAST } from "./words";
import type { DraftMan } from "./types";
import type { DraftPiece } from "./writing";

// The editor's eye for a list (Craig, 30 Sep 2026: "a bot reading a list"): a roll-call of men and their points, a
// report that goes back on itself, a lede that tells nobody's story, a forecast after Saturday, an echo of last time.
// Each is sent back, never failed, so a match-up is never dropped for its shape; two only warn. Pure.

/** A filed match-up's words, for the echo. */
export interface PastProse {
  teamIds: string[];
  prose: string;
}

type Named = { man: DraftMan; names: string[] };

const SCORE = /\b(\d{1,3})-(\d{1,3})\b/gu;
/** "a single point", "seven points", "11 points": a figure given as a man's points. */
const POINTS = /\b(a single|one|[\p{L}\d]+)\s+points?\b/giu;
/** Words before a figure that make it a gap, not a man's points. */
const GAP = /\b(?:to|by|deficit|gap|lead|margin|behind|ahead|clear|of)\s+(?:\S+\s+){0,2}$/iu;
/** Capitalised words that open a sentence or a clause, never a first name. */
const CAPS = new Set(["The", "A", "An", "And", "But", "Then", "When", "While", "After", "Before", "As", "With", "For", "So", "Yet", "Only", "Even", "Both", "Neither", "Nor", "Or", "If", "Though", "Although", "That", "This", "It", "His", "Their", "Its", "Once", "Until", "Since", "Where", "Not", "No", "All", "Each", "Every", "By", "In", "On", "At", "From", "To", "Of", "Still", "Now", "There", "Here"]);
const WEEKDAY = /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/u;
const opening = (text: string) => text.split(/\s+/u).slice(0, DRAFT_WRITING.openerWords).join(" ");

/** Every man a match-up may name, with the names the prose may use for him: full and surname. */
export function menOf(ctx: MatchupContext): Named[] {
  return everyMan(ctx.state).map((man) => ({ man, names: [...new Set([man.name, surname(man.name)])].filter((n) => n.length > 2) }));
}

const named = (text: string, men: readonly Named[]) => men.filter((m) => m.names.some((n) => mentionAt(text, n) >= 0));

/** A sentence's opening, its men and sides read as N and its figures as #, lower-cased. */
function shape(sentence: string, names: readonly string[]): string {
  const plain = [...names].sort((a, b) => b.length - a.length).reduce((out, name) => out.split(name).join(" N "), sentence);
  return opening(plain.trim())
    .toLowerCase()
    .split(/\s+/u)
    .map((w) => (numbersIn(w).length > 0 || /\d/u.test(w) ? "#" : w.replace(/[^\p{L}#]/gu, "")))
    .join(" ");
}

/** Where a man's facts sit in the gameweek, as a sortable key: the substitutions last; null when he has no beat. */
const orderOf = (ctx: MatchupContext, man: DraftMan) => {
  const beat = beatOf(ctx.state, man);
  return beat === undefined ? null : (beat ?? "~");
};

/** The first names put before a man's name that the brief never gave: "Pascal" in "Pascal Groß". */
export function unbriefedNames(prose: string, ctx: MatchupContext, block: string): string[] {
  const found = new Set<string>();
  for (const m of menOf(ctx)) {
    for (const name of m.names) {
      for (let i = prose.indexOf(name); i >= 0; i = prose.indexOf(name, i + 1)) {
        const before = prose.slice(0, i).match(/(\p{Lu}\p{Ll}+)\s+$/u)?.[1];
        if (before !== undefined && !CAPS.has(before) && !block.includes(before) && !m.man.name.includes(before)) found.add(before);
      }
    }
  }
  return [...found];
}

/** Each match-up's list faults, `at` its place on the page (0 is the lead), `block` the brief it was written from and
 *  `sides` every side's name on the page, none of them a figure. */
export function listFaults(piece: DraftPiece, ctx: MatchupContext, at: number, cutoff: Cutoff, block: string, past: readonly PastProse[], sides: readonly string[] = []): Fault[] {
  const faults: Fault[] = [];
  const n = `${at + 1}:matchup`;
  const flag = (check: string, evidence: string, severity: Fault["severity"] = "send-back") => faults.push({ section: n, check, severity, evidence });
  const men = menOf(ctx);
  // A side's name is no figure, even one spelt in digits.
  const names = [...men.flatMap((m) => m.names), ctx.state.home.side.name, ctx.state.away.side.name, ...sides];
  const figures = (text: string) => numbersIn(masked(text.replace(SCORE, " "), names).replace(/\u0000/gu, " "));
  const prose = piece.paragraphs.join("\n");
  const all = sentences(prose);

  for (const s of all) {
    const who = named(s, men).length;
    const count = figures(s).length;
    if ((who >= DRAFT_WRITING.rollCallMen && count >= 2) || count >= DRAFT_WRITING.rollCallFigures) flag("a roll-call of men and points in one sentence", s);
  }
  for (let i = 1; i < all.length; i++) if (shape(all[i], names) === shape(all[i - 1], names)) flag("two sentences in a row of the same shape", shape(all[i], names));
  for (const p of piece.paragraphs) {
    const lines = sentences(p);
    if (lines.length >= DRAFT_WRITING.rollCallParagraph && lines.every((s) => named(s.split(/\s+/u).slice(0, 2).join(" "), men).length > 0)) flag("a paragraph of men, one a sentence", p.slice(0, 80));
  }
  // A man's own points, where a sentence gives them: GW5's writer gave Gray "a single point" for his two.
  for (const s of all) {
    const who = named(s, men);
    if (who.length !== 1 || who[0].man.points === null) continue;
    for (const hit of s.matchAll(POINTS)) {
      const word = hit[1].toLowerCase();
      const n = word === "a single" || word === "one" ? 1 : figures(word)[0];
      if (n !== undefined && n !== who[0].man.points && !GAP.test(s.slice(0, hit.index))) flag("a man's points misstated", `${who[0].man.name}: ${hit[0]}, not ${who[0].man.points}`);
    }
  }
  // A man keeps other clubs out, never his own: GW5 had "Pickford kept Everton out" twice and "Justin of Leeds keeping
  // Leeds out".
  for (const m of men) {
    const own = new RegExp(`(?:kept|keeping|keeps|keep|shut|shutting|shuts)\\s+(?:the\\s+)?${escapeRegExp(m.man.club)}\\s+out|shut(?:ting|s)?\\s+out\\s+(?:the\\s+)?${escapeRegExp(m.man.club)}\\b`, "iu");
    if (m.names.some((n) => mentionAt(prose, n) >= 0) && own.test(prose)) flag("a man keeping his own club out", `${m.man.name} of ${m.man.club}`, "hard");
  }
  // A first name the brief never gave is memory, and memory was wrong: GW5's "Anthony Hall" is Lewis.
  for (const name of unbriefedNames(prose, ctx, block)) flag("a name the brief does not give", name, "hard");
  const most = at === 0 ? DRAFT_WRITING.leadMen : DRAFT_WRITING.men;
  const everyone = named(prose, men);
  if (everyone.length > most) flag(`more than ${most} men in one match-up`, everyone.map((m) => m.man.name).join(", "));
  // A haul is more than one return (Craig, 29 Sep 2026): GW5's writer called Lewis Hall's one goal "an eight-point haul".
  for (const s of all.filter((x) => /\bhaul/iu.test(x))) {
    const who = named(s, men);
    if (who.length === 1 && who[0].man.goals + who[0].man.assists + who[0].man.cleanSheets < 2) flag("a haul is more than one return", s);
  }
  // Each fact once (Craig, 30 Sep 2026: "youre just saying the same thing over and over"): a score told twice is the tell.
  const scores = [...prose.matchAll(SCORE)].map((m) => m[0]);
  const twice = scores.find((x, i) => scores.indexOf(x) !== i);
  if (twice !== undefined) flag("the same score told twice", twice);

  // The lede tells THE STORY through its cast or its side, in its own words, and never the score above it.
  const lede = all[0] ?? "";
  const angle = ctx.angle;
  if (angle !== null) {
    const sides = SIDES.map((w) => ctx.state[w].side).filter((s) => angle.story.teamId === null || s.teamId === angle.story.teamId).map((s) => s.name);
    const cast = men.filter((m) => angle.cast.includes(m.man));
    if (named(lede, cast).length === 0 && !sides.some((s) => mentionAt(lede, s) >= 0)) flag("a lede that tells no one's story", lede);
    const handed = ngrams(angle.story.facts.join(". "), DRAFT_WRITING.copied, []);
    const copied = [...ngrams(lede, DRAFT_WRITING.copied, [])].find((g) => handed.has(g));
    if (copied !== undefined) flag("a lede copied from the brief", copied);
  }
  const [h, a] = [ctx.state.home.total, ctx.state.away.total];
  if ([...lede.matchAll(SCORE)].some(([, x, y]) => (Number(x) === h && Number(y) === a) || (Number(x) === a && Number(y) === h))) flag("a lede that gives the score printed above it", lede);

  // The body follows the days and never goes back; the lede and the last line are free to.
  const body = all.slice(1, -1).join(" ");
  const order = men.flatMap((m) => {
    const key = orderOf(ctx, m.man);
    const first = Math.min(...m.names.map((name) => mentionAt(body, name)).filter((i) => i >= 0));
    return key === null || !Number.isFinite(first) ? [] : [{ m, key, first }];
  });
  order.sort((x, y) => x.first - y.first);
  const back = order.find((x, i) => order.slice(0, i).some((y) => y.key > x.key));
  if (back !== undefined) {
    const later = order.find((y) => y.key > back.key)!;
    const label = (key: string) => beatLabel(key === "~" ? null : key);
    flag("goes back to an earlier day", `${back.m.man.name} (${label(back.key)}) after ${later.m.man.name} (${label(later.key)})`);
  }

  if (cutoff === "saturday") {
    for (const s of all) if (banned(s, DRAFT_FORECAST).length > 0 || (/\bwill\b/iu.test(s) && !WEEKDAY.test(s))) flag("a forecast after Saturday: the future is for fixtures only", s);
  }

  const theirs = past.filter((p) => p.teamIds.some((id) => id === ctx.state.home.side.teamId || id === ctx.state.away.side.teamId));
  const before = new Set(theirs.flatMap((p) => [...ngrams(p.prose, DRAFT_WRITING.echo, names)]));
  const handed = ngrams(block, DRAFT_WRITING.echo, names);
  const echo = [...ngrams(prose, DRAFT_WRITING.echo, names)].find((g) => before.has(g) && !handed.has(g));
  if (echo !== undefined) flag("a phrase from these sides' last report", echo);

  // Automatic substitutions that changed the score are part of the story: GW5's 38-37 never told how 38-34 became it.
  const subs = timeline(ctx.state).find((b) => b.day === null && b.points.home !== b.points.away);
  const reserves = SIDES.flatMap((w) => ctx.state[w].subs.filter((s) => !s.provisional).map((s) => s.in.name));
  if (cutoff === "gameweek" && subs !== undefined && !/substitut|reserve/iu.test(prose) && !reserves.some((r) => mentionAt(prose, r) >= 0)) flag("the automatic substitutions go untold", `${subs.points.home}-${subs.points.away}`);

  // Warnings only: a report that never moves through the gameweek, or ends on a man's points instead of looking out.
  if (at > 0 && !WEEKDAY.test(prose) && !/substitut/iu.test(prose)) flag("no arc: it never says when", "", "warn");
  const last = all.at(-1) ?? "";
  if (named(last, men).length > 0 && figures(last).length > 0) flag("ends on a man's points, not looking out", last, "warn");
  return faults;
}
