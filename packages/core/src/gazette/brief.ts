import type { PeriodPairing } from "../league/selectors";
import type { LiveTeamScore, TeamProjection } from "../league/types";
import type { DraftPick } from "../league/fantrax/draft";
import type { AvailabilityNote, Deal, Pick, Story, TeamOfTheWeek } from "./types";

// The facts a columnist is given, and the only ones he may use.
//
// **Every guardrail this file carries is a lie it prevents.** A model handed a
// scoreline will happily narrate who scored first, what minute it went in, and
// what it means for a title race — none of which we know. So the brief states
// the facts and, beside each block, what may and may not be said about them. The
// instruction lives with the data rather than in the voice, because that is
// where it is read: a rule about `toPlay` written three hundred words above the
// number it governs is a rule about nothing.
//
// Pure, and it must stay that way. No clock, no network — the caller assembles
// the facts and this turns them into words. That is what makes the prompt
// something we can put a test around, which for a component that produces
// English is otherwise almost impossible.

/** Everything the writer is told, already reduced to what we can stand behind. */
export interface Brief {
  kind: "preview" | "report";
  gameweek: number;
  period: number;
  /** Team names by id, so the writer never invents one and the page can still
   *  join on ids afterwards. */
  teams: { teamId: string; name: string }[];
  pairings: readonly PeriodPairing[];
  /** What each squad has actually scored. Read by a REPORT. */
  scores: Map<string, LiveTeamScore>;
  /** What Fantrax reckons each squad will score. Read by a PREVIEW, and read by
   *  nothing else: before a ball is kicked `scores` is a truthful nought for
   *  everybody, so a preview built on it hands its writer nought against nought
   *  for every tie while telling him they are projections. */
  projected: Map<string, TeamProjection>;
  /** Ranked, from `stories()`. What the desk already thinks the week's stories
   *  are — the writer may disagree about emphasis, never about facts. */
  stories: readonly Story[];
  eleven: TeamOfTheWeek | null;
  /** Whether the eleven's `started` flags describe the side that was actually
   *  fielded. When false the writer is told not to mention benching at all. */
  fielded: boolean;
  deals: readonly Deal[];
  doubts: readonly AvailabilityNote[];
  /** How the last preview's calls turned out, for the writer to own or dodge. */
  marked: { right: number; called: number } | null;
  /** Where each man was drafted, by Fantrax id. Empty before a draft completes,
   *  which is the real league's state until 10 Oct. */
  pedigree: Map<string, DraftPick>;
}

export function buildBrief(brief: Brief): string {
  // Names, resolved once. Every block below reports on managers, and a block
  // that made the writer cross-reference an id against a list at the top is a
  // block inviting him to get it wrong.
  const named = new Map(brief.teams.map((team) => [team.teamId, team.name]));
  const who = (teamId: string | null) => (teamId === null ? "the wire" : named.get(teamId) ?? teamId);

  const blocks = [
    heading(brief),
    ties(brief),
    eleven(brief),
    business(brief, who),
    doubts(brief, who),
    desk(brief, who),
    marked(brief),
  ];
  return blocks.filter((block) => block !== null).join("\n\n");
}

function heading(brief: Brief): string {
  const names = brief.teams.map((team) => `${team.name} [${team.teamId}]`).join(", ");
  return [
    `EDITION: ${brief.kind === "preview" ? "PREVIEW — written after lineups locked, before a ball is kicked" : "REPORT — written after the round finished"}`,
    `GAMEWEEK ${brief.gameweek}, scored in Fantrax period ${brief.period}.`,
    `THE SIXTEEN (use these names EXACTLY; the id in brackets is what you return, never the name): ${names}`,
  ].join("\n");
}

/** The head-to-heads, with the one rule that stops every invented sentence.
 *
 *  `toPlay` is Fantrax's own count of active men whose fixture has not finished,
 *  and it is the difference between "he won" and "he is winning". Null means
 *  they did not say, which is not the same as nobody left — a distinction the
 *  app has had to relearn on three separate screens. */
function ties(brief: Brief): string | null {
  if (brief.pairings.length === 0) return null;

  const lines = brief.pairings.map((pairing) =>
    brief.kind === "preview"
      ? `- [${pairing.home.teamId}] ${pairing.home.name} ${points(brief.projected.get(pairing.home.teamId))} v ${points(brief.projected.get(pairing.away.teamId))} ${pairing.away.name} [${pairing.away.teamId}] — PROJECTED`
      : played(pairing, brief.scores),
  );

  return [
    brief.kind === "preview"
      ? "THE TIES. Nobody has kicked a ball. **Every number below is Fantrax's own projection, not a score**, and you must never write about one as though the football has happened. Write one line per tie in `ties`, and set `callsTeamId` to the id of whoever you think wins — or null if you will not call it. A tie you decline costs you nothing; a tie you call is marked next week."
      : "THE TIES (write one line per tie in `ties`; leave `callsTeamId` unset). A tie marked IN PLAY is NOT a result — do not say anyone won it.",
    "A dash is a total Fantrax did not give. It is NOT nought and you may not treat it as a low score.",
    ...lines,
  ].join("\n");
}

function played(pairing: PeriodPairing, scores: Map<string, LiveTeamScore>): string {
  const home = scores.get(pairing.home.teamId);
  const away = scores.get(pairing.away.teamId);
  // `toPlay` is Fantrax's own count of active men whose fixture has not
  // finished, and it is the whole difference between "he won" and "he is
  // winning". Null means they did not say, which is not the same as nobody left.
  const state =
    home?.toPlay === 0 && away?.toPlay === 0
      ? "FINAL"
      : `IN PLAY (${home?.toPlay ?? "?"} and ${away?.toPlay ?? "?"} still to play)`;
  return `- [${pairing.home.teamId}] ${pairing.home.name} ${points(home)} v ${points(away)} ${pairing.away.name} [${pairing.away.teamId}] — ${state}`;
}

function points(score: { points: number | null } | undefined): string {
  return score?.points === null || score?.points === undefined ? "—" : String(score.points);
}

/** The eleven, and the bench claim that is only sometimes safe to make. */
function eleven(brief: Brief): string | null {
  if (brief.eleven === null || brief.eleven.picks.length === 0) return null;

  const men = brief.eleven.picks.map((pick) => `- ${line(pick, brief.fielded, brief.pedigree)}`);
  return [
    `THE TEAM OF THE WEEK (${brief.eleven.shape}), best first. Write the "eleven" section about it.`,
    brief.pedigree.size > 0
      ? "Where a man was drafted is in brackets. USE IT ONLY WHEN IT IS THE STORY — a late pick outscoring the room, or an early one going missing. Most weeks it is not the story, and a paper that mentions every player's draft round is a spreadsheet."
      : "",
    brief.fielded
      ? 'A man marked BENCHED was left out of his own manager\'s side and scored nothing for him. That is the best story the league tells and it is worth leading on.'
      : "Do NOT say anybody was benched or left out this week: the lineups we hold are next week's, so we cannot tell who was actually picked. Write about what the players did.",
    ...men,
  ].join("\n");
}

/** `fielded` is not decoration here. Telling the writer not to mention benching
 *  while still handing him a row marked BENCHED is an instruction against a
 *  temptation we put there ourselves, and the flag is the thing that has to go. */
function line(pick: Pick, fielded: boolean, pedigree: Map<string, DraftPick>): string {
  const did = [
    pick.goals > 0 ? `${pick.goals} goals` : null,
    pick.assists > 0 ? `${pick.assists} assists` : null,
    pick.cleanSheet ? "clean sheet" : null,
    pick.saves > 0 ? `${pick.saves} saves` : null,
  ].filter((note) => note !== null);
  const done = did.length > 0 ? did.join(", ") : `${pick.minutes} minutes`;
  const benched = !fielded || pick.started ? "" : " — BENCHED";
  // An entry means he was drafted there. No entry, in a league whose draft we
  // HAVE, means he came off the waiver wire — its own pedigree and a different
  // story. No pedigree at all means we know nothing, and saying "off the wire"
  // then would tell the writer that sixteen squads went undrafted. Absence is
  // not a wire pickup, on the same rule that a dash is not a nought.
  const drafted = pedigree.get(pick.fantraxId);
  const where =
    pedigree.size === 0
      ? ""
      : drafted === undefined
        ? " [off the wire]"
        : ` [R${drafted.round}, pick ${drafted.overall}]`;
  return `${pick.playerName} (${pick.position}), owned by ${pick.ownerName}${benched}${where}: ${done}`;
}

type Who = (teamId: string | null) => string;

function business(brief: Brief, who: Who): string | null {
  if (brief.deals.length === 0) return null;
  const lines = brief.deals.slice(0, 8).map((deal) => {
    const inbound = deal.inbound.map((player) => `${player.playerName} to ${who(player.teamId)}`).join(", ");
    const outbound = deal.outbound.map((player) => player.playerName).join(", ");
    return `- ${deal.kind.toUpperCase()}: ${inbound || "—"}${outbound ? ` (out: ${outbound})` : ""}`;
  });
  return [
    "THE WEEK'S BUSINESS. A trade between two managers is the rarest thing in a draft league and is news; a waiver claim usually is not.",
    ...lines,
  ].join("\n");
}

function doubts(brief: Brief, who: Who): string | null {
  if (brief.doubts.length === 0) return null;
  // The words and the number are two fields, and FPL's words frequently contain
  // the number — so they are labelled rather than run together, which read as
  // "50% chance of playing — 50% chance of playing".
  const lines = brief.doubts.slice(0, 8).map((note) => {
    const odds = note.chance === null ? "FPL has no opinion" : `FPL: ${note.chance}%`;
    return `- ${note.playerName} (${who(note.teamId)}): ${note.news || "no detail given"} [${odds}]`;
  });
  return [
    "WHO IS HURT, in FPL's own words. No opinion is not nought: a player they have said nothing about is not a player they have ruled out.",
    ...lines,
  ].join("\n");
}

/** What the desk already thinks the stories are.
 *
 *  Handed over as a ranking rather than as instructions: the running order is
 *  argued in `stories.ts` and the writer is entitled to disagree about which
 *  matters most. What he is not entitled to do is find a story in facts he was
 *  not given. */
function desk(brief: Brief, who: Who): string | null {
  if (brief.stories.length === 0) return null;
  const lines = brief.stories.map((story) => {
    if (story.kind === "bench") {
      return `- LEFT OUT: ${story.pick.ownerName} did not start ${story.pick.playerName}${story.lost ? `, and lost ${story.lost.loser.points}–${story.lost.winner.points} to ${story.lost.winner.name}` : ""}`;
    }
    if (story.kind === "trade") return `- TRADE: ${story.sides.map(who).join(" and ")} did business`;
    const word = story.kind === "squeaker" ? "DECIDED BY NOTHING" : "A HAMMERING";
    return `- ${word}: ${story.result.winner.name} beat ${story.result.loser.name} by ${story.result.margin}`;
  });
  return ["THE DESK'S RUNNING ORDER, strongest first. Lead on one of these.", ...lines].join("\n");
}

function marked(brief: Brief): string | null {
  if (brief.marked === null) return null;
  return `YOUR LAST COLUMN: you called ${brief.marked.right} of ${brief.marked.called}. Own it in a line — briefly, and without a paragraph of excuses.`;
}
