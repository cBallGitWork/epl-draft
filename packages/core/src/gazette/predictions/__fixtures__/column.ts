import type { CheckContext, LawroDraft } from "../checks";
import { tieKey } from "../checks";
import { LAWRO_CORE, PAST } from "../past";
import type { PredictionCall } from "../pick";

// The skit writer's sample column and the brief behind it, which must come through the editor clean.

export const TEAMS: Record<string, string> = {
  rs: "Real Sociable", bn: "Bayer Neverlusen", im: "Inter Mittent", bt: "Borussia Teeth", nf: "Nottingham Florist",
  sc: "Sporting Chance", av: "Aston Vanilla", pa: "Plymouth Argos", st: "Sheffield Thursday", rr: "Rovers Return",
};

export const call = (home: string, away: string, calls: string, over: Partial<PredictionCall> = {}): PredictionCall => ({
  homeTeamId: home, awayTeamId: away, callsTeamId: calls, instinct: null, score: { home: 50, away: 40 }, close: false, ...over,
});

export const CALLS = [
  call("rs", "bn", "rs"),
  call("im", "bt", "bt", { instinct: "doubt", close: true }),
  call("nf", "sc", "sc", { instinct: "liverpool", close: true }),
  call("av", "pa", "pa"),
  call("st", "rr", "rr"),
];

export const BRIEF = `LAWRO'S PREDICTIONS, gameweek 11. Your record: 2 right from 5. Your gut calls: 0 from 2.
Real Sociable are 1st: won 3, drawn 0, lost 0. Oduya (M, Arsenal, home to Leeds United). Bayer Neverlusen signed Pym (D, Ipswich) and Kettle (F, Coventry).
Inter Mittent's best man, Callum Reid (F, Newcastle, home to Brighton), is a doubt, and FPL gives him 50 per cent. Borussia Teeth.
Liverpool men in the squad: Sporting Chance 3, Nottingham Florist 1. Agyeman (M, Liverpool, home to Hull). Aston Vanilla lost 2. Plymouth Argos.
Crabtree (F, Leeds, away at Arsenal). Sheffield Thursday: Mullan (D, Crystal Palace) is suspended. Pickering (G, Hull, away at Liverpool).
Rovers Return: Sousa (M, Manchester United, away at Aston Villa). Lawro.`;

export const ctx = (over: Partial<CheckContext> = {}): CheckContext => ({
  calls: CALLS,
  name: (teamId) => TEAMS[teamId] ?? teamId,
  facts: [BRIEF, LAWRO_CORE, PAST[2].line].join("\n"),
  offered: [PAST[2]],
  names: Object.values(TEAMS),
  past: [],
  ...over,
});

export const SAMPLE: [string, string][] = [
  ["rs-bn", "Real Sociable have won all three and Oduya has Leeds. Bayer Neverlusen signed Pym and Kettle on Wednesday. They'll need more than two."],
  ["im-bt", "On paper it's Inter Mittent. Their best man, Callum Reid, is down as 50-50 with a hamstring. I'd want to see him warm up. Borussia Teeth, by the skin of them."],
  ["nf-sc", "Nottingham Florist are favourites, just. Sporting Chance have three Liverpool men to their one. I once went 159 games without having Liverpool down to lose. I'm not starting on a Thursday."],
  ["av-pa", "Agyeman gets Hull at home. Aston Vanilla have lost two on the bounce, and Crabtree goes to Arsenal. Plymouth Argos win this."],
  ["st-rr", "Sheffield Thursday are without Mullan, who is suspended, and Pickering has Liverpool away. Rovers Return's Sousa has a hard one at Villa. It won't matter."],
];

export const draft = (ties: [string, string][] = SAMPLE, over: Partial<LawroDraft> = {}): LawroDraft => ({
  headline: "Reid Between The Lines",
  deck: "Lawro goes against the favourites twice, backing Borussia Teeth and Sporting Chance.",
  intro: "Two from five, and the gut calls went nought from two. I did this for the BBC for twenty-two years. It shows. I've two more this week.",
  ties: new Map(ties.map(([key, line]) => [key, { line, backs: CALLS.find((each) => tieKey(each.homeTeamId, each.awayTeamId) === key)?.callsTeamId ?? null }])),
  ...over,
});

