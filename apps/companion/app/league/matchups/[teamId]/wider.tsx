import ScrollBoard from "../../../components/league/ScrollBoard";
import type { ReactNode } from "react";
import { seasonForm, sortRows, londonDayAndTime, ordinal, playerName, printedPlaces, DASH } from "@epl/core";
import type { Club, Fixture, LineupDetail, RosteredTeam } from "@epl/core";
import { fixtureInvolvement } from "@epl/core";
import { teamColours } from "@/app/teamColours";
import { seasonFixtures } from "../../../football";
import ScoreRow from "../../../components/shell/ScoreRow";
import { scoreSide } from "../../../components/football/scoreSide";
import { byKickoff, fixtureMen, type FixtureMan } from "./fixtureMen";
import Columns from "../../Columns";
import TableRow from "../../TableRow";
import { getSeasonResults } from "../../schedule/schedule";
import { leagueTable } from "../../../standings";
import { leagueInfo, readCalendar } from "../../../round";
import Nothing from "../../../components/shell/Nothing";
import { BOARD, PANEL } from "@/app/desk";
import { matchHref } from "../../../prem/match/[id]/matchRoutes";
import { clubPlaces } from "../../../prem/places";

// The two boards that place this tie rather than explain it: the league it sits in, and the football it is
// being played out in.

/** The league table itself (Craig, 11 Sep 2026), both sides of the tie edged in their own colours, as on the scoreline;
 *  `mine` keeps its one meaning. */
export async function TableTab({ tie, mine }: { tie: readonly string[]; mine: string | null }) {
  const [rows, info, results, calendar] = await Promise.all([
    leagueTable(),
    leagueInfo(),
    getSeasonResults(),
    readCalendar(),
  ]);

  if ("unavailable" in rows || rows.length === 0) {
    return (
      <section className={PANEL}>
        <Nothing title="No table yet">
          Fantrax has not published a standing for this league.
        </Nothing>
      </section>
    );
  }

  const form = new Map(
    seasonForm(rows, info?.matchups ?? [], results).map((team) => [team.teamId, team.run]),
  );
  const places = printedPlaces(rows);

  return (
    <section className={PANEL}>
      <ScrollBoard>
        <table className={BOARD}>
          <Columns sort="rank" descending={false} />
          <tbody>
            {sortRows(rows, "rank", false).map((row) => (
              <TableRow
                key={row.teamId}
                sort="rank"
                row={row}
                place={places.get(row.teamId) ?? ordinal(row.rank)}
                mine={row.teamId === mine}
                form={form.get(row.teamId) ?? []}
                tint={tie.includes(row.teamId) ? teamColours(row.teamId).primary : undefined}
                calendar={calendar}
              />
            ))}
          </tbody>
        </table>
      </ScrollBoard>
    </section>
  );
}

/** Every real match either squad has a man in, as the Live tab draws a fixture (`ScoreRow`), each manager's
 *  men and their Fantrax points under it: the URL's side from the left, the other from the right. A side
 *  whose eleven is not public names nobody. */
export async function FixturesTab({
  fixtures,
  sides,
  snapshotClubs,
  withheld,
}: {
  fixtures: readonly Fixture[];
  sides: readonly { roster: RosteredTeam | undefined; detail: LineupDetail | undefined }[];
  snapshotClubs: readonly Club[];
  withheld: ReactNode;
}) {
  const clubs = new Map(snapshotClubs.map((club) => [club.id, club]));
  // A club's place in the real table, for each row's blue blocks, as the Live tab sets them.
  const places = clubPlaces(await seasonFixtures(), snapshotClubs);
  const involved = sides.map(({ roster }) => (roster === undefined ? new Map() : fixtureInvolvement(roster, fixtures)));
  const ours = byKickoff(fixtures.filter((f) => involved.some((byFixture) => (byFixture.get(f.id) ?? []).length > 0)));

  if (ours.length === 0) {
    return (
      <section className={PANEL}>
        <Nothing title="No matches yet">Neither squad holds a player in this gameweek&rsquo;s fixtures.</Nothing>
      </section>
    );
  }

  return (
    <section className={PANEL}>
      {withheld}
      <ul className="cm-rows flex flex-col">
        {ours.map((fixture) => (
          <li key={fixture.id} className="flex flex-col">
            <ScoreRow
              home={scoreSide(clubs.get(fixture.homeClubId), places)}
              away={scoreSide(clubs.get(fixture.awayClubId), places)}
              score={
                fixture.homeScore === null || fixture.awayScore === null
                  ? null
                  : { home: fixture.homeScore, away: fixture.awayScore }
              }
              pending={fixture.kickoff === null ? "TBC" : londonDayAndTime(fixture.kickoff)}
              clock={
                fixture.status === "live" ? (
                  <span className={`${CLOCK} numeric text-live`}>{fixture.minutes}&prime;</span>
                ) : fixture.status === "finished" ? (
                  <span className={`${CLOCK} text-faint`}>FT</span>
                ) : null
              }
              href={matchHref(fixture.id, "overview")}
            />
            <div className="grid grid-cols-2 divide-x divide-line bg-surface">
              {sides.map((side, at) => (
                <Men key={at} men={fixtureMen(side.detail, fixture.id)} end={at === 0} />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The state of a match beside its score, as the Live tab sets it. */
const CLOCK = "text-sm font-bold uppercase lg:text-base";

/** One manager's men in one match, set against the centre rule; a reserve is dimmed, his figure uncounted. */
function Men({ men, end }: { men: readonly FixtureMan[]; end: boolean }) {
  return (
    <ul className="flex min-w-0 flex-col py-1">
      {men.map(({ player, reserve, scored }) => (
        <li
          key={player.rostered.slot.fantraxId}
          className={`flex min-w-0 items-baseline gap-1.5 px-2 py-0.5 text-sm ${end ? "flex-row-reverse text-right" : ""} ${reserve ? "text-muted" : ""}`}
          title={reserve ? "On the bench: not counted" : undefined}
        >
          <span className="min-w-0 truncate font-chrome font-bold">{playerName(player.rostered)}</span>
          <span className={`numeric shrink-0 ${reserve ? "" : "text-info"}`}>
            {scored && player.points != null ? player.points : DASH}
          </span>
        </li>
      ))}
    </ul>
  );
}
