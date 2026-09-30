import { listed } from "../../format";
import { ordinal } from "../../league/ordinal";
import { londonDayOf, londonWeekdayLong } from "../../time";
import type { Cutoff, MatchupContext, NextOpponent } from "./brief";
import { counted, everyMan, type SideState } from "./state";
import { fitnessLine, minutesLine, newLine, pts, returnWords, withClub } from "./stories";
import type { Thread } from "./thread";
import { SIDES, beatLabel, beatOf, timeline, type Beat } from "./timeline";
import type { DraftMan } from "./types";

// One match-up's block of the brief, built on the story the desk chose (`angle.ts`): the result, THE STORY and its twist,
// the cast, how it unfolded a day at a time, the threads in their beats, the rest, the season for the close, what comes
// next and last time's story. A cast man's points appear once, in THE CAST. The labels are the writer's and never print.

const when = (beat: string | null | undefined) => (beat === undefined ? "" : ` (${beatLabel(beat)})`);
const told = (t: Thread) => `${t.facts.join("; ")}${when(t.beat)}`;
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
    sub === undefined ? null : `${sub.provisional ? "replaces" : "replaced"} ${sub.out.name}, who did not play${sub.provisional ? ", if he plays" : ""}`,
    bench ? "on the bench, where his points count for nobody" : null,
    minutesLine(m),
    s === undefined ? null : newLine(m, s.side),
    fitnessLine(m),
    next,
  ];
  return `- ${withClub(m)} for ${s?.side.name ?? "neither side"}: ${parts.filter((p) => p !== null).join("; ")}${when(beatOf(ctx.state, m))}`;
}

/** A beat in a line: each side's points, the running score after it, and who returned in it, without their points. */
function beatLine(ctx: MatchupContext, b: Beat, minor: boolean): string {
  const { home, away } = ctx.state;
  const [h, a] = [b.score.home, b.score.away];
  const score = h === a ? `level at ${h}-${a}` : `${Math.max(h, a)}-${Math.min(h, a)} to ${h > a ? home.side.name : away.side.name}`;
  const returns = b.returns.map((r) => {
    const goals = r.man.scoredAt.filter((t) => b.day === null || londonDayOf(t.kickoff) === b.day);
    return `${r.man.name} (${returnWords({ goals: r.goals, assists: r.assists, cleanSheets: r.cleanSheets, scoredAt: goals })}) for ${ctx.state[r.side].side.name}`;
  });
  const who = returns.length === 0 ? "" : `; returns: ${listed(returns, "and")}`;
  const label = beatLabel(b.day);
  return `- ${label[0].toUpperCase()}${label.slice(1)}${minor ? ", may be left out" : ""}: ${home.side.name} ${b.points.home}, ${away.side.name} ${b.points.away}, making it ${score}${who}`;
}

/** After Saturday, each match still to come by its day, a match with both sides' men in it first. Fixtures only. */
function toCome(ctx: MatchupContext): string[] {
  const matches = new Map<string, { kickoff: string; men: Map<string, string[]> }>();
  for (const s of [ctx.state.home, ctx.state.away]) {
    for (const m of s.toPlay) {
      if (m.next === null) continue;
      const label = m.next.home ? `${m.club} v ${m.next.opponent}` : `${m.next.opponent} v ${m.club}`;
      const match = matches.get(label) ?? { kickoff: m.next.kickoff, men: new Map<string, string[]>() };
      const provisional = s.subs.some((x) => x.in === m && x.provisional);
      match.men.set(s.side.name, [...(match.men.get(s.side.name) ?? []), `${m.name}${provisional ? " (if he plays)" : ""}`]);
      matches.set(label, match);
    }
  }
  return [...matches]
    .sort(([, a], [, b]) => b.men.size - a.men.size || a.kickoff.localeCompare(b.kickoff))
    .map(([label, m]) => `- ${label}, ${londonWeekdayLong(m.kickoff)}: ${[...m.men].map(([side, men]) => `${listed(men, "and")} for ${side}`).join("; ")}`);
}

/** Where each side goes next, for a last line that looks out; nothing after Saturday, with the gameweek unfinished. */
function nextLines(ctx: MatchupContext): string[] {
  const line = (name: string, next: NextOpponent | null) => (next === null ? [] : [`- ${name} play ${next.name}${next.rank === null ? "" : `, ${ordinal(next.rank)} after this gameweek`}`]);
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
  const chosen = angle === null ? [] : [angle.story, ...(angle.twist === null ? [] : [angle.twist]), ...angle.supporting];
  const cast = new Set(angle?.cast ?? []);
  const beats = timeline(ctx.state);
  // A day with none of the cast in it and none of the chosen threads may be left out.
  const minor = (b: Beat) => !b.returns.some((r) => cast.has(r.man)) && !chosen.some((t) => t.beat === b.day);
  const saturday = cutoff === "saturday";
  return [
    `MATCH-UP ${n}: ${ctx.state.home.side.name} v ${ctx.state.away.side.name}${n === 1 ? ", THE LEAD" : ""}`,
    `${saturday ? "THE SCORE after Saturday's matches" : "THE RESULT"}, printed above your words, never in them: ${ctx.state.score}.`,
    angle === null ? "THE STORY: the result alone." : `THE STORY, which your first sentence tells: ${told(angle.story)}`,
    angle?.twist == null ? null : `THE TWIST, told in its beat: ${told(angle.twist)}`,
    block("THE CAST, each man's points given once:", [...cast].map((m) => castLine(ctx, m))),
    block(saturday ? "HOW IT STANDS, in order:" : "HOW IT UNFOLDED, in order:", beats.map((b) => beatLine(ctx, b, minor(b)))),
    saturday ? block("STILL TO COME, the fixtures only:", toCome(ctx)) : null,
    block("THREADS, each told in its beat:", (angle?.supporting ?? []).filter((t) => t.scope !== "season").map((t) => `- ${told(t)}`)),
    block("THE REST, may be left out, told as a group without points:", (angle?.rest ?? []).map((t) => `- ${told(t)}`)),
    // The bracketed kind tells the writer which frame a fact takes; it is never printed.
    block("FORM AND THE TABLE, for the close:", ctx.form.filter((f) => !angle?.story.facts.includes(f.text)).map((f) => `- ${f.text} [${f.kind}]`)),
    saturday ? null : block("NEXT GAMEWEEK, may be left out:", nextLines(ctx)),
    block("LAST TIME, not to be told the same way again:", lastLines(ctx)),
  ]
    .filter((b) => b !== null)
    .join("\n\n");
}
