import { listed } from "../../format";
import { ordinal } from "../../league/ordinal";
import { londonDayOf, londonWeekdayLong } from "../../time";
import type { Cutoff, MatchupContext, NextOpponent } from "./brief";
import { counted, everyMan, type SideState } from "./state";
import { fitnessLine, minutesLine, newLine, pts, returnWords, withClub } from "./stories";
import type { Thread } from "./thread";
import { SIDES, beatLabel, beatOf, timeline, type Beat } from "./timeline";
import { possessive } from "./words";
import type { DraftMan } from "./types";

// One match-up's block of the brief, built on the story the desk chose (`angle.ts`): the result, THE STORY and its twist,
// the cast, how it unfolded a day at a time, the threads in their beats, the season for the close, what comes next and
// last time's story. A cast man's points are given once, in THE CAST; the labels are the writer's and never print.

const when = (beat: string | null | undefined) => (beat === undefined ? "" : ` (${beatLabel(beat)})`);

/** A thread's facts in its beat, led by its side's name when they do not give it: GW5's writer gave test2's blanks to
 *  123 from a line that named neither. */
function told(ctx: MatchupContext, t: Thread): string {
  const side = SIDES.map((w) => ctx.state[w].side).find((s) => s.teamId === t.teamId)?.name;
  const facts = t.facts.join("; ");
  return `${side === undefined || facts.includes(side) ? "" : `${side}: `}${facts}${when(t.beat)}`;
}
const block = (head: string, lines: readonly string[]) => (lines.length === 0 ? null : [head, ...lines].join("\n"));

function sideOf(ctx: MatchupContext, m: DraftMan): SideState | undefined {
  return SIDES.map((w) => ctx.state[w]).find((s) => [...s.side.eleven, ...s.side.bench].includes(m));
}

/** A cast man in one line: his side, his points and what made them, how he came into it, and anything else about him. */
function castLine(ctx: MatchupContext, m: DraftMan): string {
  const s = sideOf(ctx, m);
  const sub = s?.subs.find((x) => x.in === m);
  const bench = s !== undefined && sub === undefined && !counted(s).includes(m);
  const points = m.points === null || (m.minutes === 0 && m.left > 0) ? "yet to play" : `${pts(m.points)}${m.goals + m.assists + m.cleanSheets > 0 ? `: ${returnWords(m)}` : ""}`;
  const next = m.left > 0 && m.next !== null ? `plays ${m.next.home ? "at home to" : "away to"} ${m.next.opponent} on ${londonWeekdayLong(m.next.kickoff)}` : null;
  const parts = [
    points,
    sub === undefined ? null : sub.ahead !== null ? "comes into the eleven at the end of the gameweek for a man who did not play, whom not yet settled" : `${sub.provisional ? "replaces" : "replaced"} ${sub.out.name}, who did not play${sub.provisional ? ", if he plays" : ""}`,
    // A reserve played his own match, on its own day, before the substitutions counted it: GW5 had him "yet to kick a ball".
    sub !== undefined && m.minutes > 0 ? `played ${m.minutes >= 90 ? "the whole match" : `${m.minutes} minutes`} for ${m.club}${m.byDay[0] === undefined ? "" : ` on ${beatLabel(m.byDay[0].day)}`}` : null,
    bench ? "on the bench, where his points count for nobody" : null,
    minutesLine(m),
    s === undefined ? null : newLine(m, s.side),
    fitnessLine(m),
    next,
  ];
  // The day comes with the man, not after his figures: GW5's writer gave Groß's Saturday 11 to Friday's 11.
  const beat = beatOf(ctx.state, m);
  const day = beat === undefined ? "" : beat === null ? ", in the automatic substitutions" : `, on ${beatLabel(beat)}`;
  // The side comes first, and a reserve is called one: GW5's writer gave test3's reserves to test4.
  const whose = s === undefined ? "" : `${possessive(s.side.name)} ${sub !== undefined || bench ? "reserve " : ""}`;
  return `- ${whose}${withClub(m)}${day}: ${parts.filter((p) => p !== null).join("; ")}`;
}

/** What a beat did to the gap, said outright: GW5's writers had a gap that fell from 11 to 10 "widened", and "nearly
 *  levelled". */
function moved(ctx: MatchupContext, before: { home: number; away: number }, b: Beat): string {
  const leader = (s: { home: number; away: number }) => (s.home > s.away ? ctx.state.home.side.name : s.home < s.away ? ctx.state.away.side.name : null);
  const [was, now] = [Math.abs(before.home - before.away), Math.abs(b.score.home - b.score.away)];
  const [then, lead] = [leader(before), leader(b.score)];
  if (lead === null) return then === null ? "still level" : "level again";
  if (then === null) return "";
  if (then !== lead) return `the lead passing from ${then} to ${lead}`;
  return now === was ? `the gap unchanged at ${now}` : `the gap ${now > was ? "up" : "down"} from ${was} to ${now}`;
}

/** A beat in a line: each side's points, the running score after it and what that did to the gap, and every return in
 *  it by name, without points. A reserve's return is told in the automatic substitutions, where it counted, never on
 *  the day he played. */
function beatLine(ctx: MatchupContext, b: Beat, before: { home: number; away: number }): string {
  const { home, away } = ctx.state;
  const [h, a] = [b.score.home, b.score.away];
  const change = moved(ctx, before, b);
  const score = `${h === a ? `level at ${h}-${a}` : `${Math.max(h, a)}-${Math.min(h, a)} to ${h > a ? home.side.name : away.side.name}`}${change === "" ? "" : `, ${change}`}`;
  const scored = b.returns.map((r) => {
    const goals = r.man.scoredAt.filter((t) => b.day === null || londonDayOf(t.kickoff) === b.day);
    return `${possessive(ctx.state[r.side].side.name)} ${withClub(r.man)} (${returnWords({ goals: r.goals, assists: r.assists, cleanSheets: r.cleanSheets, scoredAt: goals })})`;
  });
  // Points with no return are minutes and defensive work: GW5's writer twice had a Friday won "before a ball was kicked".
  const none = b.points.home + b.points.away === 0 ? "no returns" : "no returns, the points all for minutes and defensive work";
  const label = beatLabel(b.day);
  return `- ${label[0].toUpperCase()}${label.slice(1)}: ${home.side.name} ${b.points.home}, ${away.side.name} ${b.points.away}, making it ${score}; ${scored.length === 0 ? none : `returns: ${listed(scored, "and")}`}`;
}

/** After Saturday, what is still to come by match and day, fixtures only: a match with both sides' men in it named whole
 *  and first, the cast's matches named, and every other man counted. Each man carries his club, so none is sent to the
 *  wrong ground (GW5: "Isak away to Liverpool"). */
function toCome(ctx: MatchupContext, cast: ReadonlySet<DraftMan>): string[] {
  const matches = new Map<string, { kickoff: string; men: Map<string, DraftMan[]> }>();
  for (const s of [ctx.state.home, ctx.state.away]) {
    for (const m of s.toPlay) {
      if (m.next === null) continue;
      const label = m.next.home ? `${m.club} v ${m.next.opponent}` : `${m.next.opponent} v ${m.club}`;
      const match = matches.get(label) ?? { kickoff: m.next.kickoff, men: new Map<string, DraftMan[]>() };
      match.men.set(s.side.name, [...(match.men.get(s.side.name) ?? []), m]);
      matches.set(label, match);
    }
  }
  const waiting = new Set([ctx.state.home, ctx.state.away].flatMap((s) => s.subs.filter((x) => x.provisional).map((x) => x.in)));
  const who = (m: DraftMan) => `${m.name} of ${m.club}${waiting.has(m) ? " (if he plays)" : ""}`;
  const lines: string[] = [];
  // Men not named, by day and side: "On Sunday, 2 more of test2's men play, and 1 of 123's".
  const unnamed = new Map<string, Map<string, number>>();
  for (const [label, match] of [...matches].sort(([, a], [, b]) => b.men.size - a.men.size || a.kickoff.localeCompare(b.kickoff))) {
    const day = londonWeekdayLong(match.kickoff);
    const shown = [...match.men].map(([side, men]) => [side, match.men.size > 1 ? men : men.filter((m) => cast.has(m))] as const);
    const told = shown.filter(([, men]) => men.length > 0);
    if (told.length > 0) lines.push(`- ${label}, ${day}: ${told.map(([side, men]) => `${listed(men.map(who), "and")} for ${side}`).join("; ")}`);
    const counts = unnamed.get(day) ?? new Map<string, number>();
    for (const [side, men] of match.men) counts.set(side, (counts.get(side) ?? 0) + men.length - (shown.find(([s]) => s === side)?.[1].length ?? 0));
    unnamed.set(day, counts);
  }
  for (const [day, counts] of unnamed) {
    const rest = [...counts].filter(([, n]) => n > 0).map(([side, n]) => `${n} more of ${possessive(side)} men`);
    if (rest.length > 0) lines.push(`- On ${day}, in other matches, ${listed(rest, "and")} play`);
  }
  return lines;
}

/** Where each side goes next, for a last line that looks out; nothing after Saturday, with the gameweek unfinished. */
function nextLines(ctx: MatchupContext): string[] {
  // The rank is the opponent's, said so: GW5's writer read "test3 play test2, 3rd" as test3's place.
  const line = (name: string, next: NextOpponent | null) => (next === null ? [] : [`- ${name} play ${next.name}${next.rank === null ? "" : `, who are ${ordinal(next.rank)} after this gameweek`}`]);
  return [...line(ctx.state.home.side.name, ctx.next.home), ...line(ctx.state.away.side.name, ctx.next.away)];
}

/** Each side's last story in words, so this one is told another way. */
function lastLines(ctx: MatchupContext): string[] {
  const men = everyMan(ctx.state);
  return (ctx.angle?.past ?? []).map((p) => {
    const sides = SIDES.map((w) => ctx.state[w].side).filter((s) => p.teamIds.includes(s.teamId)).map((s) => s.name);
    const cast = p.cast.flatMap((id) => men.find((m) => m.fantraxId === id)?.name ?? []);
    return `- ${listed(sides, "and")}: a ${p.kind.replace(/-/gu, " ")}${cast.length === 0 ? "" : `, told through ${listed(cast, "and")}`}`;
  });
}

export function matchupBlock(ctx: MatchupContext, cutoff: Cutoff, n: number): string {
  const angle = ctx.angle;
  const cast = new Set(angle?.cast ?? []);
  const saturday = cutoff === "saturday";
  const line = (t: Thread) => `- ${told(ctx, t)}`;
  return [
    `MATCH-UP ${n}: ${ctx.state.home.side.name} v ${ctx.state.away.side.name}${n === 1 ? ", THE LEAD" : ""}`,
    `${saturday ? "THE SCORE after Saturday's matches" : "THE RESULT"}, printed above your words, never in them: ${ctx.state.score}.`,
    angle === null ? "THE STORY: the result alone." : `THE STORY, which your first sentence tells: ${told(ctx, angle.story)}`,
    angle?.twist == null ? null : `THE TWIST, told in its beat: ${told(ctx, angle.twist)}`,
    block("THE CAST, each man's points given once:", [...cast].map((m) => castLine(ctx, m))),
    block(saturday ? "HOW IT STANDS, in order:" : "HOW IT UNFOLDED, in order:", timeline(ctx.state).map((b, i, all) => beatLine(ctx, b, all[i - 1]?.score ?? { home: 0, away: 0 }))),
    saturday ? block("STILL TO COME, the fixtures only:", toCome(ctx, cast)) : null,
    block("THREADS, each told in its beat:", (angle?.supporting ?? []).filter((t) => t.scope !== "season").map(line)),
    // The bracketed kind tells the writer which frame a fact takes; it is never printed.
    block("FORM AND THE TABLE, for the close:", ctx.form.filter((f) => !angle?.story.facts.includes(f.text)).map((f) => `- ${f.text} [${f.kind}]`)),
    saturday ? null : block("NEXT GAMEWEEK, for a last line that looks out:", nextLines(ctx)),
    block("LAST TIME, not to be told the same way again:", lastLines(ctx)),
  ]
    .filter((b) => b !== null)
    .join("\n\n");
}
