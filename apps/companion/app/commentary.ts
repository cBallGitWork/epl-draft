import { unstable_cache } from "next/cache";
import {
  PAGE_REVALIDATE,
  type FootballPlayer,
  type MatchEvent,
  type RoundBreak,
  mapRoundBreaks,
  mapRoundGoals,
} from "@epl/core";
import type { PlCommentaryLine } from "@epl/core";
import {
  fetchPlFixture,
  fetchPlRound,
  fetchPlTextstream,
  plCommentary,
  plFixtureCode,
  plTeamSheets,
  shortProse,
} from "@epl/core";
import bridge from "../../../data/mappings/premierleague.json";

// The round's goals, from the Premier League's own feed.
//
// **One request for ten matches.** Their round-level fixtures read carries a
// `goals` array per match — scorer, assister, minute — so the question the Live
// tab exists to answer costs a single upstream call however many matches are on
// and however many phones are open. Counted across gameweeks 1-3, that array
// reconciles with the scoreline on 21 of 21 played fixtures.
//
// FPL cannot answer this at any price: it publishes no minute for a goal
// anywhere, and the sister repo's export runs about a day behind full time.
//
// Nothing about who is asking crosses in here — the real Premier League is the
// same for everybody — so it sits beside `footballNow` rather than inside
// `leagueCache`, and the ownership join happens a layer up in `matchday/wire`.

/** Premier League player id → Opta code, harvested from team sheets by
 *  `npm run pl-bridge`.
 *
 *  Asserted rather than parsed, once, at this edge — the same trade
 *  `squads.ts` records for the Fantrax bridge. `packages/core/tsconfig.json`
 *  includes only `src/**`, so core physically cannot read `data/`. */
const PL_TO_OPTA: Record<string, string> = bridge.players;

/** Opta code → FPL `code`, built in memory from the bootstrap the app already
 *  holds. `optaCode` is on all 652 elements, so this needs no new field and
 *  nothing per-season is written to disk. */
function optaToCode(players: readonly FootballPlayer[]): Map<string, number> {
  const codes = new Map<string, number>();
  for (const player of players) {
    if (player.optaCode !== null) codes.set(player.optaCode, player.code);
  }
  return codes;
}

/** The two hops as one map, which is what `mapRoundGoals` takes. */
function playerCodes(players: readonly FootballPlayer[]): Map<number, number> {
  const opta = optaToCode(players);
  const codes = new Map<number, number>();
  for (const [plId, optaCode] of Object.entries(PL_TO_OPTA)) {
    const code = opta.get(optaCode);
    if (code !== undefined) codes.set(Number(plId), code);
  }
  return codes;
}

/** One round's fixtures from the Premier League, cached per round.
 *
 *  Cached rather than read per request for the reason every other football read
 *  here is: sixteen managers refreshing all weekend cost them one request per
 *  window between them. Their own `cache-control` is `max-age=30`, which is
 *  already `PAGE_REVALIDATE`, so the two agree.
 *
 *  Kept raw rather than mapped because the mapping needs the bootstrap, which is
 *  a different cache with a different lifetime — folding them together would
 *  make the round's goals expire whenever a price changed. */
const plRound = unstable_cache(
  async (gameweek: number) => fetchPlRound(gameweek),
  ["pl-round"],
  { revalidate: PAGE_REVALIDATE },
);

/** Every goal in the round, joined to FPL players and ordered as they happened.
 *
 *  Ordered on `absolute` — kick-off plus elapsed — and NOT on the match clock: a
 *  12:30 match and a 17:30 one both start their own clock at nought, so a round
 *  sorted on `seconds` puts the afternoon in the wrong sequence. A goal whose
 *  match carries no kick-off time has no place in that order and sorts last
 *  rather than into 1970.
 *
 *  Newest first, because the question this answers is "what just happened".
 *
 *  Returns `[]` rather than throwing when their API refuses. That is not the
 *  swallow §2 forbids: the caller renders the round's football either way, and
 *  an empty wire under a live scoreline is a panel with nothing in it, not a
 *  claim that nothing happened — `Wire` says which it is from `speaksForNow`. */
export async function roundGoals(
  gameweek: number,
  players: readonly FootballPlayer[],
): Promise<MatchEvent[]> {
  const round = await plRound(gameweek);
  const goals = mapRoundGoals(round.content, playerCodes(players));
  return goals.sort((a, b) => (b.absolute ?? 0) - (a.absolute ?? 0));
}

/** Every interval reached in the round — half time and full time, oldest first.
 *
 *  Craig, 5 Sep 2026: *"Wire should also include half and full time."* Off the
 *  SAME cached round read the goals come from, so the wire's whole cost is still
 *  one upstream request for ten matches. The per-fixture textstream carries
 *  Opta's own `end 1` and `end 14` lines and would cost ten.
 *
 *  Empty rather than a throw, for `roundGoals`' reason: the caller draws the
 *  round either way, and a wire missing its full-time lines is a wire with fewer
 *  lines rather than a claim that nothing has finished. */
export async function roundBreaks(gameweek: number): Promise<RoundBreak[]> {
  return mapRoundBreaks((await plRound(gameweek)).content);
}

/** Every line of Opta's commentary across the round, newest first, with the
 *  club names cut down.
 *
 *  **The second wire** (Craig, 5 Sep 2026: *"WE use the match report text? … but
 *  we can shortern it"*, and *"maybe we have different versions of the wire on
 *  the home page for now and decide which is best"*). It answers three of his
 *  asks at once, because Opta's own sentences already carry what our row wire
 *  cannot: `GOAL OVERTURNED BY VAR: Florian Wirtz scores but the goal is ruled
 *  out` and `Penalty Brentford. Kevin Schade draws a foul in the penalty area` —
 *  the VAR line and the man who won a penalty, which our league pays a fantasy
 *  assist for.
 *
 *  **And it is the expensive wire, which is the point of offering both.** The row
 *  wire is ONE request for ten matches, off the round read. This is one per
 *  fixture that has kicked off — up to ten more, ~200 KB, per thirty-second
 *  window — because the textstream is the only place the prose exists and there
 *  is no round-level equivalent. Both are cached on the same window, so the cost
 *  is per window and not per reader; a reader who never opens this variant pays
 *  none of it.
 *
 *  Ordered on `kickoff + seconds`, not on `seconds`: a 12:30 match and a 17:30
 *  one both start their own clock at nought, and `plCommentary` sorts within one
 *  match by construction. An unstarted fixture is skipped rather than asked —
 *  its stream is a header and no events.
 *
 *  Empty, never a throw, at every step: a wire is something this page adds to a
 *  round it can already draw. */
export async function roundCommentary(gameweek: number): Promise<ProseLine[]> {
  const round = await plRound(gameweek).catch(() => null);
  if (round === null) return [];

  // Opta's long name to the short one, off the SAME object — each fixture's
  // `teams[].team` carries both, so the shortener needs no table of our own and
  // no second read.
  const names = new Map<string, string>();
  for (const fixture of round.content) {
    for (const side of fixture.teams ?? []) {
      const long = side.team?.name;
      const short = side.team?.club?.abbr ?? side.team?.shortName;
      if (long && short) names.set(long, short);
    }
  }

  const lines: ProseLine[] = [];
  for (const fixture of round.content) {
    if (fixture.status === "U") continue;
    const kickoff = fixture.kickoff?.millis;
    const stream = await plStream(fixture.id).catch(() => null);
    if (stream === null) continue;
    for (const line of plCommentary(stream.events.content)) {
      if (!WIRE_TYPES.has(line.type)) continue;
      // **`end 14` carries a junk clock and has to borrow the fixture's.** Its
      // own time is `{secs: 0, label: "01"}` — `map.ts` records the label as junk
      // and drops only events with NO time, so "Match ends" survives with a
      // reading of nought and sorts to kick-off, above every goal in its own
      // match. The final whistle is the fixture's `clock`, which the round read
      // beside it already carries.
      const ends = line.type === FULL_TIME;
      const seconds = ends ? (fixture.clock?.secs ?? line.seconds) : line.seconds;
      lines.push({
        id: `${fixture.id}:${line.id}`,
        minute: ends ? "FT" : line.minute,
        text: shortProse(line.text, names),
        at: kickoff === undefined ? null : kickoff + seconds * 1000,
      });
    }
  }

  return lines.sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
}

/** Opta's types a WIRE prints, out of the twenty-odd it publishes.
 *
 *  **The whole vocabulary is a firehose, not a wire.** Counted across the 28
 *  played fixtures of GW1-3: 642 `free kick lost`, 627 `free kick won`, 280
 *  `miss`, 252 `corner`, 240 `attempt blocked`. Unfiltered, the first ten lines
 *  of a round were four free kicks, an added-time announcement and two missed
 *  shots — `plCommentary` keeps everything on purpose, because a match REPORT
 *  wants the whole thing, and the filter belongs to the caller that does not.
 *
 *  These nine are what a teleprinter prints and what our league pays for: the
 *  score, the two cards, the substitution that ends a man's minutes, the goal VAR
 *  took away, and the man who WON a penalty — the last two being exactly what
 *  Craig asked for and what the row wire has no source for.
 *
 *  `end 14` and not `end 2`: the first is "Match ends", the second is "Second
 *  Half ends", and a wire that prints both says full time twice. `end 1` is half
 *  time, which came off this panel the same evening.
 *
 *  Opta's own strings, verbatim, for the reason `KINDS` in core is written out —
 *  the strings are theirs and a translation table is the only honest place to
 *  meet them. */
const FULL_TIME = "end 14";

const WIRE_TYPES = new Set([
  "goal",
  "penalty goal",
  "own goal",
  "VAR cancelled goal",
  "penalty won",
  "yellow card",
  "red card",
  "substitution",
  FULL_TIME,
]);

/** One line of the prose wire. */
export interface ProseLine {
  /** Stable across polls: the fixture's id and the event's own, because an
   *  event id is unique within a stream and not across the round. */
  id: string;
  /** The clock as the feed prints it — `"07"`, `"45+2"` — or `"FT"`, which is
   *  the one line whose own label is junk. */
  minute: string;
  /** Opta's sentence, with the club names cut down and the club in brackets
   *  after a player removed. Never paraphrased. */
  text: string;
  /** Kick-off plus elapsed, the only field that orders ten matches. */
  at: number | null;
}

/** One fixture's detail, cached per Premier League id.
 *
 *  Their own read, ~24 KB, and the only source of an unused substitute anywhere
 *  in this app — see `plTeamSheets`. Cached on the same thirty seconds as
 *  everything else here, so a match page refreshing all afternoon costs them one
 *  request per window between every reader.
 *
 *  Raw rather than mapped, for `plRound`'s reason: the mapping needs the
 *  bootstrap, which is a different cache with a different lifetime, and folding
 *  them together would expire a team sheet whenever a price changed. */
const plFixture = unstable_cache(
  async (id: number) => fetchPlFixture(id),
  ["pl-fixture"],
  { revalidate: PAGE_REVALIDATE },
);

/** Both sides' team sheets for one of OUR fixtures, or null.
 *
 *  **Two hops, because the two providers number matches differently.** We hold
 *  FPL's season-stable `code`; the Premier League wants its own id. The round
 *  read carries both — that is what `altIds=true` buys — so the round resolves
 *  the id and the detail read answers the sheet. Both are cached, and the round
 *  one is already warm from the wire.
 *
 *  Null, never a throw, at every step that can fail: a round they will not serve,
 *  a fixture our code does not appear in, a match nobody has named a side for.
 *  A team sheet is something a match page adds to a board it can already draw
 *  without one, so its absence costs a bench and never the screen.
 */
async function theirFixtureId(gameweek: number, fixtureCode: number): Promise<number | null> {
  const round = await plRound(gameweek);
  return round.content.find((fixture) => plFixtureCode(fixture) === fixtureCode)?.id ?? null;
}

export async function teamSheets(
  gameweek: number,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<ReturnType<typeof plTeamSheets>> {
  try {
    const id = await theirFixtureId(gameweek, fixtureCode);
    if (id === null) return null;
    return plTeamSheets(await plFixture(id), optaToCode(players));
  } catch {
    return null;
  }
}

/** One fixture's commentary, cached per Premier League id.
 *
 *  4-19 KB for a played match and about 880 bytes for one nobody has started —
 *  an unstarted fixture answers its header and no events rather than a 404,
 *  which is what makes this safe to ask for on any match page. `pageSize` is
 *  `PL_TEXTSTREAM_PAGE` because the recorded match carries 107 events and the
 *  provider's own default truncates at 100. */
const plStream = unstable_cache(
  async (id: number) => fetchPlTextstream(id),
  ["pl-textstream"],
  { revalidate: PAGE_REVALIDATE },
);

/** Opta's minute-stamped commentary for one of OUR fixtures, newest first.
 *
 *  Craig, 5 Sep 2026: *"needs a match report section that we take from the
 *  premier league site."* This is that read, and it is the one DESIGN §2 has
 *  named as missing since the reference library was catalogued — "a
 *  text-commentary matchday". The mapper was written and tested on 4 Sep and
 *  drew nothing until now.
 *
 *  Empty, never a throw, at every step that can fail — the same tolerance
 *  `teamSheets` has and for the same reason: a report is something a match page
 *  adds to a screen it can already draw. */
export async function matchReport(
  gameweek: number,
  fixtureCode: number,
): Promise<PlCommentaryLine[]> {
  try {
    const id = await theirFixtureId(gameweek, fixtureCode);
    if (id === null) return [];
    return plCommentary((await plStream(id)).events.content);
  } catch {
    return [];
  }
}

/** Every goal's minute in ONE fixture, by FPL player code.
 *
 *  Craig, 5 Sep 2026: *"live match, we can add the minutes too this now."* He is
 *  right that it is new: the scoresheet's minutes came from the sister repo's
 *  match log, which has **20 of 380** matches in it, so the overwhelming
 *  majority of scorers had a name and no clock. The Premier League's round read
 *  carries a minute for every goal in all ten matches, for one request, and it
 *  is already cached for the wire.
 *
 *  Merged INTO the log rather than replacing it, and the log wins a tie: it is
 *  the sister repo's own reading of the same match, and where the two disagree
 *  the argument is not one this function should settle silently. In practice
 *  they never meet — 20 fixtures against 380.
 */
export async function matchGoalMinutes(
  gameweek: number,
  fixtureCode: number,
  players: readonly FootballPlayer[],
  logged: Map<number, number[]>,
): Promise<Map<number, number[]>> {
  const minutes = new Map(logged);
  try {
    for (const goal of await roundGoals(gameweek, players)) {
      if (goal.fixtureCode !== fixtureCode) continue;
      // An own goal is credited to the man who put it in his own net, and the
      // scoresheet already prints him under the side he plays FOR with `og`
      // beside his name — so his minute belongs to him, not to the beneficiary.
      const code = goal.players[0];
      if (code === null || code === undefined || minutes.has(code)) continue;
      // `minute` reads "45+2" for stoppage time; the scoresheet takes numbers,
      // so the added-time half is dropped rather than guessed at. A goal in the
      // 47th minute of the first half is a 45th-minute goal on any teleprinter.
      const at = Number.parseInt(goal.minute, 10);
      if (Number.isNaN(at)) continue;
      minutes.set(code, [...(minutes.get(code) ?? []), at]);
    }
  } catch {
    // Their API refusing costs the minutes and never the scoresheet.
  }
  return minutes;
}
