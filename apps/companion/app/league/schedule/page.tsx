import type { ReactNode } from "react";
import {
  COMPETITIONS,
  LEAGUE_COMPETITION,
  PLACEHOLDER_ROUNDS,
  POLL,
  type CompetitionTie,
  groupTies,
  leagueTies,
  periodPairings,
  seededTies,
} from "@epl/core";
import AutoRefresh from "../../components/shell/AutoRefresh";
import Nothing from "../../components/shell/Nothing";
import Section from "../../components/shell/Section";
import LeagueShell from "../Shell";
import Controls from "./Controls";
import RoundHeader from "./RoundHeader";
import Season from "./Season";
import Tie from "./Tie";
import { getSchedule, getSeasonResults, type ScheduleRound } from "./schedule";
import { seasonRows } from "./teamSeason";
import { footballNow } from "../../football";
import { liveScores } from "../../scoreboard";
import { myTeamId } from "../../session";
import { teamBadges } from "../../badges";
import { FANTRAX_SILENT } from "../../config";

// The season, one gameweek at a time across every competition being played on
// it — or one team's thirty-eight, end to end. Fantrax's schedule is the league;
// the cup and the playoff are ours, declared in `league/competitions.ts`, which
// is also where the note saying they are a placeholder comes from.
//
// It opens on the round a reader came for — the one in play, or the next to kick
// off — with that round's scores already on it. A gameweek that has been played
// keeps its scores, so this is the archive too.
//
// The page speaks gameweeks and never periods. Both were on screen, they are the
// same number all season, and printing one number under two names asks a reader
// to work out whether they are the same thing.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** What the URL may say. All three are optional and all three are checked
 *  against what the league has: a typed gameweek outside the calendar, or a team
 *  that is not in this league, opens the default view rather than an empty one. */
interface Query {
  gw?: string;
  comp?: string;
  team?: string;
}

/** The round a reader means, resolved once.
 *
 *  Both views need it and they used to work it out separately, with different
 *  fallbacks — one ended the season, the other started it. That is two answers
 *  to one question, which is one more than a page may have. */
function chooseRound(
  rounds: readonly ScheduleRound[],
  asked: string | undefined,
  now: number,
): ScheduleRound {
  const wanted = Number(asked);
  return (
    rounds.find((round) => round.gameweek === wanted) ??
    // FPL's own answer to "which gameweek is it" — the one in play, else the
    // next up — narrowed to a round the league covers, because a season joined
    // at gameweek 6 has no gameweek 1.
    rounds.find((round) => round.gameweek >= now) ??
    rounds[rounds.length - 1]
  );
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<Query> }) {
  const [read, query, football] = await Promise.all([getSchedule(), searchParams, footballNow()]);

  if ("unavailable" in read) {
    return (
      <LeagueShell title="Schedule" current="schedule">
        <Nothing title={FANTRAX_SILENT} code={read.unavailable}>
          The schedule is part of the league&apos;s own description of itself, and we cannot read it
          right now.
        </Nothing>
      </LeagueShell>
    );
  }

  const { info, rounds, table } = read;
  if (rounds.length === 0) {
    return (
      <LeagueShell title="Schedule" current="schedule" sub={info.name}>
        <Nothing
          title="No calendar to read"
          code={`${info.scoringPeriods.length} periods, 0 gameweeks`}
        >
          Fantrax describes the league&apos;s periods but none of them holds a gameweek, so there is
          no round to show its fixtures against.
        </Nothing>
      </LeagueShell>
    );
  }

  const [mine, crests] = await Promise.all([myTeamId(info.teams), teamBadges()]);
  const round = chooseRound(rounds, query.gw, football.gameweek);
  const chosenTeam = info.teams.find((entry) => entry.teamId === query.team) ?? null;
  const chosen = COMPETITIONS.find((competition) => competition.id === query.comp) ?? null;

  /** Every tie in one gameweek: Fantrax's pairings and our declared knockouts. */
  const tiesIn = (at: ScheduleRound): CompetitionTie[] =>
    [
      ...leagueTies(periodPairings(info.matchups, info.teams, at.period)),
      ...seededTies(PLACEHOLDER_ROUNDS, table, at.gameweek),
    ].filter((tie) => chosen === null || tie.competition.id === chosen.id);

  const shell = (children: ReactNode) => (
    <LeagueShell title="Schedule" current="schedule" sub={info.name}>
      <Controls
        gameweeks={rounds.map((entry) => entry.gameweek)}
        gameweek={round.gameweek}
        competition={chosen?.id ?? ""}
        teams={info.teams}
        team={chosenTeam?.teamId ?? ""}
        mine={mine}
      />
      {children}
    </LeagueShell>
  );

  // ---- One team's whole season ------------------------------------------
  if (chosenTeam !== null) {
    // One request for the whole season's results, and only on this branch: a
    // reader looking at one gameweek must not pay for thirty-eight.
    const rows = seasonRows(rounds, tiesIn, await getSeasonResults(), chosenTeam.teamId);

    return shell(
      rows.length === 0 ? (
        <Nothing title="Nothing on this calendar" code={`${rounds.length} gameweeks`}>
          {chosen === null
            ? `Fantrax has paired ${chosenTeam.name} with nobody this season, and no knockout round has drawn them either.`
            : `${chosenTeam.name} is not in the ${chosen.name.toLowerCase()} this season.`}
        </Nothing>
      ) : (
        <Season rows={rows} badges={crests} />
      ),
    );
  }

  // ---- One gameweek ------------------------------------------------------
  const ties = tiesIn(round);

  // Only once there is football to have scored in. Fantrax answers for any
  // period asked, so a reader browsing March would otherwise spend a request per
  // gameweek on totals the board has already decided not to print.
  const board = round.started ? await liveScores(round.period) : null;
  const points = new Map([...(board?.scores ?? [])].map(([team, score]) => [team, score.points]));

  return shell(
    <>
      {/* Only while the round on screen is the one being played. A reader
          looking at March in August is not watching anything move. */}
      {round.status === "live" ? <AutoRefresh seconds={POLL.live} /> : null}

      <RoundHeader round={round} />

      {board?.refused ? (
        <p className="px-3 text-2xs text-faint">
          Fantrax&apos;s scoreboard is not answering, so there are no points to show. The fixtures
          below are still right. <span className="numeric">{board.refused}</span>
        </p>
      ) : null}

      {ties.length === 0 ? (
        <Nothing title="Nothing on" code={`gameweek ${round.gameweek}`}>
          {chosen === null
            ? "No competition has a fixture in this gameweek — a bye, or a league nobody has been drawn into yet."
            : `The ${chosen.name.toLowerCase()} is not played in this gameweek.`}
        </Nothing>
      ) : (
        <div className="flex flex-col gap-4">
          {groupTies(ties).map((group) => (
            <Section
              key={`${group.competition.id}-${group.round ?? ""}`}
              title={
                group.round === null
                  ? group.competition.name
                  : `${group.competition.name} · ${group.round}`
              }
              aside={group.competition.id === LEAGUE_COMPETITION.id ? undefined : "Placeholder draw"}
            >
              <ul className="flex flex-col gap-1.5">
                {group.ties.map((tie, at) => (
                  <li key={`${tie.home.label}-${tie.away.label}-${at}`}>
                    <Tie
                      tie={tie}
                      points={points}
                      badges={crests}
                      round={round}
                      mine={mine}
                    />
                  </li>
                ))}
              </ul>
            </Section>
          ))}
        </div>
      )}
    </>,
  );
}
