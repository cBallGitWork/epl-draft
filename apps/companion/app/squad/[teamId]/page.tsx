import { notFound } from "next/navigation";
import {
  FANTRAX_APP_BASE,
  FANTRAX_LEAGUE_ID,
  clubById,
  lineupDetail,
  oppositionByClub,
  playerDetail,
  playerName,
  squadDetail,
  squadUnarranged,
} from "@epl/core";
import LineupPlanner from "../../components/league/LineupPlanner";
import SeasonGrid from "../../components/league/SeasonGrid";
import SquadBoard from "../../components/league/SquadBoard";
import Sheet from "./Sheet";
import TeamShell from "./Shell";
import { getLeagueSquads, readableOr404, teamDisplay } from "../../squads";
import { lastLockedRound, leagueInfo, planningRound, roundOf } from "../../round";
import { pendingByTeam, squadLivePoints } from "../../scoreboard";
import { squadSeason } from "../../teamStats";
import { myTeamId } from "../../session";
import { OWN, SQUAD } from "../routes";
import { identify, whoseTeam } from "./team";

// One manager's squad, laid out on a pitch. The screen the league opens on a
// Saturday, and the reason the join exists.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  /** Which round's squad. Absent means the round a manager can still change —
   *  next week's, once this week's lineups have locked — which is every arrival
   *  from the table, the matchup card and the squad list. It used to mean the
   *  round Fantrax points at unasked, so mid-Saturday this screen drew a locked
   *  eleven under a running score; the score is Live's job.
   *  The schedule sends a gameweek, so tapping a side in a March fixture opens
   *  March's fifteen rather than this week's — which is the only useful thing
   *  about a fixture in March, and was the one thing that row did not do. */
  searchParams: Promise<{ gw?: string }>;
}) {
  // `teamId` is what the folder is called; `slug` is what the reader typed, and
  // on the front door those are not the same thing. See `squad/routes.ts`.
  const [{ teamId: slug }, { gw }] = await Promise.all([params, searchParams]);

  // Through the calendar seam, never by taking one number for the other: the
  // period is what Fantrax is asked for and the gameweek is what FPL is asked
  // for. Same resolution the head-to-head route makes.
  const asked = Number(gw);
  // **Which week this screen is about, and it is not the same question for every
  // team** (Craig, 2 Sep, more than once: tapping a squad from the league should
  // land on a pitch).
  //
  // Your own squad is about the week you can still CHANGE — that is what a
  // planner is — so it takes the planning round. Everybody else's is about an
  // arrangement, and the planning week is precisely the one the gate withholds:
  // pointing a rival's screen there meant the eleven was never visible from an
  // ordinary tap, all week, every week. The last LOCKED week is the most recent
  // one that has an arrangement to show, and on a Saturday it is the live one.
  //
  // `?gw=` still wins over both: a reader who named a week gets that week.
  //
  // Resolved from the league's own team list rather than from the roster read
  // this decides, which would be circular: `leagueInfo` names every team and is
  // separately cached, so asking it costs nothing a squad screen was not already
  // paying.
  // Named apart from `mine` below, which is the authority: that one validates
  // against the ROSTERED teams and is what every gate and label reads. This is
  // the same question asked early enough to choose a week, off the league's own
  // list, and the two can only disagree for a team that exists in the league and
  // holds no roster — which has no squad screen to show either way.
  const info = await leagueInfo();
  // The front door asks for its own team by name, so it needs no id to compare:
  // `/squad/me` is by definition the week its reader can still change.
  const asksOwn =
    slug === OWN || (info !== null && (await myTeamId(info.teams)) === slug);

  const round = Number.isInteger(asked)
    ? await roundOf(asked)
    : asksOwn
      ? await planningRound()
      : await lastLockedRound();
  const squads = readableOr404(await getLeagueSquads(round), SQUAD);

  // Whose squad this is. Most visits to this route are to somebody else's — the
  // matchup card and the squad list both lead here — and the two readings want
  // different things said, so the page knows which it is serving.
  //
  // It is also what the front door resolves to: a reader who is not signed in
  // has no own team, and the index is where the code goes in.
  const { teamId, mine } = await whoseTeam(slug, squads.period.teams);

  const team = squads.period.teams.find((t) => t.teamId === teamId);
  if (!team) notFound();

  const clubs = clubById(squads.snapshot);
  const opposition = oppositionByClub(squads.snapshot);
  // What this reader may see of THIS team, which is not the league-wide answer:
  // your own lineup is yours all week, a rival's waits for his period to open.
  const display = teamDisplay(squads, mine);

  // The rules the planner enforces, or null when it may not open — because this
  // is a rival's squad and rearranging it is not yours to do, or because Fantrax
  // would not tell us the rules and a planner that cannot enforce a cap is worse
  // than none. One value rather than a flag beside a nullable, so there is no
  // arrangement of the two that type-checks and still opens the planner with
  // nothing to enforce.
  const planning = mine && display.show === "lineup" && squads.info !== null ? squads.info : null;
  const squadIds = new Set(team.players.map((p) => p.slot.fantraxId));

  // What each of them is ELIGIBLE at, which is not the slot his manager filed
  // him in. Fantrax publishes both and they disagree for 48 of 607 — Saka is
  // `F,M` and is filed at M — so the list's position column reads this and the
  // scoring reads the slot. Fifteen entries, not the pool's 697: this crosses to
  // the browser and the other 682 are not this manager's business.
  //
  // A record rather than a `Map` because of that crossing: the boundary
  // serialises through JSON and a `Map` arrives as `{}` with no `.get`.
  const eligibility: Record<string, string[]> = {};
  for (const state of squads.info?.players ?? []) {
    if (squadIds.has(state.fantraxId)) eligibility[state.fantraxId] = state.eligiblePositions;
  }

  // What our league scores each of them, and the two branches below read it from
  // different places on purpose.
  //
  // With the gate OPEN the numbers come off the live scoreboard, priced at the
  // slot each man is filling and scoped to this period — the only per-player
  // figure Fantrax publishes that agrees with the total on their own board.
  //
  // With the gate CLOSED they cannot: that payload is keyed by the eleven, so
  // reading it here would rebuild the arrangement this branch exists to
  // withhold. The season table names all fifteen and says nothing about how they
  // are arranged, which is exactly what a withheld squad wants — and it is a
  // season total, which is why it is still labelled as one.
  //
  // Joining the squad to its clubs and fixtures happens here either way, on the
  // server: it is pure and tested in core, and doing it in the browser would
  // mean shipping every club and every fixture in the round for fifteen lookups.
  // One value rather than a period beside a flag, for the same reason `planning`
  // above is one: there is then no arrangement of the two that type-checks and
  // still asks the live scoreboard for a period nobody named.
  const priced =
    display.show === "lineup" && squads.roundPeriod !== null && squads.info !== null
      ? { period: squads.roundPeriod, categories: squads.info.scoringCategories }
      : null;
  const live = priced === null
    ? null
    : await squadLivePoints(priced.period, teamId, priced.categories);
  // Tied to the branch that LABELS it a season total, not to the absence of the
  // live one. `priced` also needs `squads.info`, so with `getLeagueInfo` refused
  // — a modelled, separately-cached state — an own-team lineup fell through to
  // the season table and `Sheet` rendered it under a card headed "This period",
  // at a man's default position rather than his roster slot. This is the same
  // condition `board` is built on, so the two cannot disagree.
  const season = display.show === "squad" ? await squadSeason(teamId) : null;
  const points = (live?.points ?? season?.points) ?? null;
  const board =
    display.show === "squad"
      ? {
          because: display.because,
          projected: season?.stats.season.projected ?? false,
          lines: squadDetail(squadUnarranged(team), clubs, opposition, points),
        }
      : null;
  // Fantrax's stat rows carry an id and no name, deliberately: the squad already
  // names every one of them and a second copy is the one that disagrees when a
  // commissioner renames somebody.
  const names = new Map(team.players.map((rostered) => [rostered.slot.fantraxId, playerName(rostered)]));

  // The one number Fantrax's live feed withholds: a clean sheet is not credited
  // until the final whistle, so a squad's visible total understates it for the
  // last half-hour of every match. Two screens already say it — the Live tab's
  // own tie and the head-to-head board — and this is the third, which is the
  // screen a manager is actually on when he wonders why his defenders are worth
  // nothing.
  //
  // **`display` and not `squads.display`**, and the distinction is the gate's.
  // Only ACTIVE players are owed one, so a `+8` beside a squad says a defender is
  // in the eleven — exactly the fact the gate withholds before a deadline.
  // `pendingByTeam` refuses on anything but `show === "lineup"`, and the value
  // handed to it here is THIS team's own answer: your XI is yours all week, a
  // rival's waits for his period to open.
  //
  // Nought is not a preview. A squad owed nothing prints nothing rather than a
  // `+0`, which would read as a claim that the clean sheets have been counted.
  const owed = pendingByTeam([team], squads.info?.scoring ?? null, squads.snapshot, display).get(
    teamId,
  )?.points;
  const pending = owed ? owed : null;

  return (
    /* The only live-points surface that did not move on a Saturday. Both
       arrangements below carry Fantrax's totals and FPL's minutes, and
       `revalidate` bounds staleness without pushing anything to a phone already
       open on the sofa. Same cadence as the head-to-head board that shows the
       same numbers. */
    <TeamShell
      team={identify(team, slug)}
      title={mine ? "Your squad" : "Squad"}
      current="squad"
    >
      {planning !== null ? (
        <LineupPlanner
          team={team}
          // The whole squad's detail, flat: the planner rearranges it in the
          // browser, so it cannot be handed lines grouped on the server.
          //
          // Points were `null` here, which made your own squad the one pitch in
          // the app printing minutes where every other printed what our league
          // scores him. A man's points are a fact about him and not about the
          // arrangement, so rearranging cannot disturb them.
          details={team.players.map((rostered) =>
            playerDetail(rostered, clubs, opposition, points),
          )}
          // Fifteen players' eligibility, not the pool's 697. This crosses to
          // the browser, and the other 682 are not this manager's business.
          players={planning.players.filter((p) => squadIds.has(p.fantraxId))}
          limits={planning.roster}
          fantraxUrl={`${FANTRAX_APP_BASE}/${FANTRAX_LEAGUE_ID}`}
          pending={pending}
        />
      ) : board !== null ? (
        /* The gate. Before his lineups lock a rival's XI is not visible — the
           shape and the active/reserve split are withheld together. The squad
           itself is not: fifteen names, who they play this week, and nothing
           about how they will be arranged.

           Branching on the board rather than on the display again: it exists
           exactly when the gate is closed, so there is no arrangement of the two
           that renders a board with nothing on it. */
        /* Two panels, and above `lg` they stand beside each other. That is not a
           preference: Championship Manager's own content area is 710px of an
           800px canvas, and a 1440 screen less the rail is 1310 — so one panel
           up here is not a CM screen scaled up, it is a CM screen with half of
           it missing. Split in two, each panel is about the width the whole game
           had. Below `lg` they stack, and never the other way round: a band
           above the pitch comes out of the pitch's own screen budget.
           `items-start` so the shorter panel does not stretch to the taller
           one's height, and **`minmax(0,1fr)` on the single column below `lg` as
           well as on the pair above it**: a grid item's default `min-width: auto`
           is its content's min-content width, so the season grid's seventeen
           columns widened the whole page rather than scrolling inside their own
           panel — a 390 phone laid out at 627. The `overflow-x-auto` around the
           table cannot help while the column it sits in is free to grow. */
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <SquadBoard
            lines={board.lines}
            because={board.because}
            projected={board.projected}
            eligibility={eligibility}
          />
          {/* The second panel, and it costs one cache hit. `squadSeason` already
              reads this table to price the board; what it used to drop on the
              floor is thirteen scoring columns, a per-game figure and Fantrax's
              own name for the season. */}
          {season !== null ? <SeasonGrid stats={season.stats} names={names} /> : null}
        </div>
      ) : (
        /* A rival's XI, once his lineups have locked. Read-only: it is his — but
           every man on it opens the same card the head-to-head board opens, so
           "why is he on 12" has one answer wherever it is asked.

           Arranged here and only here: this is the branch where the lineup is
           public, and building it on the others would be work whose only product
           is a payload nobody may read. The spread is the arrangement itself —
           `rows` and `bench`, which is the whole of what the join returns. */
        <Sheet
          {...lineupDetail(team, clubs, opposition, points)}
          breakdown={live?.breakdown ?? {}}
          pending={pending}
          eligibility={eligibility}
        />
      )}
    </TeamShell>
  );
}
