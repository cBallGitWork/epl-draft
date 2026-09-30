import { listed } from "../../format";
import { ordinal } from "../../league/ordinal";
import { londonDayOf, londonWeekdayLong } from "../../time";
import type { Cutoff, MatchupContext, NextOpponent } from "./brief";
import { counted, everyMan, type SideState } from "./state";
import { fitnessLine, minutesLine, newLine, pts, returnWords } from "./stories";
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

/** What a slot's man is called in a paper's introduction: "Brighton midfielder Pascal Groß". */
const POSITION: Record<string, string> = { G: "goalkeeper", D: "defender", M: "midfielder", F: "forward" };

/** A cast man in one line, introduced as a paper introduces him, with his side, his points and what made them, how he
 *  came into it, and anything else about him. */
function castLine(ctx: MatchupContext, m: DraftMan): string {
  const s = sideOf(ctx, m);
  const sub = s?.subs.find((x) => x.in === m);
  const bench = s !== undefined && sub === undefined && !counted(s).includes(m);
  const points = m.points === null || (m.minutes === 0 && m.left > 0) ? "yet to play" : `${pts(m.points)}${m.goals + m.assists + m.cleanSheets > 0 ? `: ${returnWords(m)}` : ""}`;
  const next = m.left > 0 && m.next !== null ? `plays ${m.next.home ? "at home to" : "away to"} ${m.next.opponent} on ${londonWeekdayLong(m.next.kickoff)}` : null;
  const parts = [
    points,
    sub === undefined ? null : sub.ahead !== null ? "comes on at the end of the gameweek for a man who did not play" : `${sub.out.name} did not play, so he ${sub.provisional ? "comes on if he plays" : "came on"}`,
    // A reserve played his own match, on its own day, before the substitutions counted it: GW5 had him "yet to kick a ball".
    sub !== undefined && m.minutes > 0 && m.byDay[0] !== undefined ? `played for ${m.club} on ${beatLabel(m.byDay[0].day)}` : null,
    bench ? "on the bench, where his points count for nobody" : null,
    minutesLine(m),
    s === undefined ? null : newLine(m, s.side),
    fitnessLine(m),
    next,
  ];
  // The day comes with the man, not after his figures: GW5's writer gave Groß's Saturday 11 to Friday's 11.
  const beat = beatOf(ctx.state, m);
  const day = beat === undefined ? "" : beat === null ? ", in the automatic substitutions" : `, on ${beatLabel(beat)}`;
  // Introduced as the BBC introduces him, "Everton goalkeeper Jordan Pickford"; his side named, a reserve called one.
  const whose = s === undefined ? "" : `, ${sub !== undefined || bench ? "a reserve " : ""}for ${s.side.name}`;
  return `- ${m.club} ${POSITION[m.slot] ?? "player"} ${m.fullName}${whose}${day}: ${parts.filter((p) => p !== null).join("; ")}`;
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
    return `${possessive(ctx.state[r.side].side.name)} ${r.man.fullName} (${returnWords({ goals: r.goals, assists: r.assists, cleanSheets: r.cleanSheets, scoredAt: goals })})`;
  });
  // Points with no return are minutes and defensive work: GW5's writer twice had a Friday won "before a ball was kicked".
  const none = b.points.home + b.points.away === 0 ? "no returns" : "no returns (appearance and defensive points only)";
  const label = beatLabel(b.day);
  return `- ${label[0].toUpperCase()}${label.slice(1)}: ${home.side.name} ${b.points.home}, ${away.side.name} ${b.points.away}, making it ${score}; ${scored.length === 0 ? none : `returns: ${listed(scored, "and")}`}`;
}

/** After Saturday, what is still to come, fixtures only: the story's men, any reserve waiting on his match and each
 *  side's likeliest man still to play (the projection picks him and never prints), each with his match and day, then how
 *  many each side has left. Nobody else by name, so the writer lists nobody (GW5's Saturday named every man). */
function toCome(ctx: MatchupContext, cast: ReadonlySet<DraftMan>): string[] {
  const waiting = new Set([ctx.state.home, ctx.state.away].flatMap((s) => s.subs.filter((x) => x.provisional).map((x) => x.in)));
  const lines = [ctx.state.home, ctx.state.away].flatMap((s) =>
    s.toPlay
      .filter((m, i) => m.next !== null && (i === 0 || cast.has(m) || waiting.has(m)))
      .map((m) => `- ${m.fullName} for ${s.side.name}${waiting.has(m) ? ", if he plays" : ""}: ${m.next!.home ? "at home to" : "away to"} ${m.next!.opponent} on ${londonWeekdayLong(m.next!.kickoff)}`),
  );
  const left = [ctx.state.home, ctx.state.away].map((s) => `${s.side.name} ${s.toPlay.length}`);
  return [...lines, `- Men still to play: ${listed(left, "and")}`];
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
