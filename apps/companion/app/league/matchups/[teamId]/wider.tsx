import { seasonForm, sortRows } from "@epl/core";
import type { Fixture, LeagueTeam, RosteredTeam } from "@epl/core";
import { fixtureInvolvement, teamColours } from "@epl/core";
import Columns from "../../Columns";
import TableRow from "../../TableRow";
import { getSeasonResults } from "../../schedule/schedule";
import { leagueTable, teamBadges } from "../../../standings";
import { leagueInfo } from "../../../round";
import Nothing from "../../../components/shell/Nothing";
import { londonDayAndTime } from "../../../londonTime";
import { BOARD, PANEL, SCROLL } from "@/app/desk";

// The two boards that PLACE this tie rather than explain it: the league it sits
// in, and the football it is being played out in.
//
// Split from `tabs.tsx` when the four shared boards together went past
// CODE_RULES §4's hard ceiling. The seam is the subject: those two are our
// competition's scoring joined across the two squads, and these two are
// everything around it.

/** The league table, with the two sides of this tie marked.
 *
 *  **The table itself, not a door to it** (Craig, 11 Sep 2026: *"goes to a page
 *  with just the league table (not the league table page itself)"*). What it
 *  answers here that `/league` does not is what THIS result does to both
 *  positions, which is why both rows are marked rather than only the reader's.
 *
 *  **The mark cannot be `TableRow`'s `mine`.** That paints `bg-raised`, and its
 *  own docblock says a tinted band "reads as *these are yours*" — which would be
 *  a lie about a rival. Each tie row takes a left border in its own
 *  `teamColours` instead, the same colour as its half of the scoreline above, so
 *  the two objects are tied together rather than competing. `mine` still marks
 *  the reader's own row and keeps its one meaning. */
export async function TableTab({ tie, mine }: { tie: readonly string[]; mine: string | null }) {
  const [rows, badges, info, results] = await Promise.all([
    leagueTable(),
    teamBadges(),
    leagueInfo(),
    getSeasonResults(),
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

  return (
    <section className={PANEL}>
      <div className={SCROLL}>
        <table className={BOARD}>
          <Columns sort="rank" descending={false} />
          <tbody>
            {sortRows(rows, "rank", false).map((row) => (
              <TableRow
                key={row.teamId}
                sort="rank"
                row={row}
                badge={badges.get(row.teamId)}
                mine={row.teamId === mine}
                form={form.get(row.teamId) ?? []}
                tint={tie.includes(row.teamId) ? teamColours(row.teamId).primary : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** The real matches this tie is being played out in.
 *
 *  Craig, 11 Sep 2026: *"Scores should show the prem matches that effected the
 *  match up for the weekend, date time/etc"*.
 *
 *  **Only the fixtures holding a man from either squad**, which is the whole
 *  point: a round is ten matches and a tie is usually fought out in six of them.
 *  `fixtureInvolvement` answers the membership as a JOIN on FPL's own player
 *  code — never a name match — so a fixture with nobody's man in it is simply
 *  not a key.
 *
 *  It replaces the Report tab, which filtered the same round's GOAL WIRE to the
 *  same thirty men. That board answered "what has happened"; this answers "where
 *  is it being decided", which is the question a manager has at ten to three
 *  rather than at five. */
export function ScoresTab({
  fixtures,
  sides,
  clubName,
}: {
  fixtures: readonly Fixture[];
  sides: readonly { team: LeagueTeam; roster: RosteredTeam | undefined; shown: boolean }[];
  clubName: (id: number) => string;
}) {
  const involved = sides.map(({ team, roster, shown }) => ({
    team,
    shown,
    byFixture: roster === undefined ? new Map() : fixtureInvolvement(roster, fixtures),
  }));
  const ours = fixtures.filter((fixture) =>
    involved.some(({ byFixture }) => (byFixture.get(fixture.id) ?? []).length > 0),
  );

  if (ours.length === 0) {
    return (
      <section className={PANEL}>
        <Nothing title="No matches yet">
          Neither squad holds a player in this round&rsquo;s fixtures.
        </Nothing>
      </section>
    );
  }

  return (
    <section className={PANEL}>
      <ul className="flex flex-col gap-2">
        {ours.map((fixture) => (
          <li key={fixture.id} className="flex flex-col gap-1 border-b border-line pb-2 last:border-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate font-chrome text-sm font-bold lg:text-base">
                {clubName(fixture.homeClubId)} v {clubName(fixture.awayClubId)}
              </span>
              <Score fixture={fixture} />
            </div>
            {/* The clock, which is what this tab is for before kick-off. */}
            <span className="numeric text-2xs text-faint">
              {fixture.kickoff === null ? "Kick-off TBC" : londonDayAndTime(fixture.kickoff)}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {involved.map(({ team, shown, byFixture }) => (
                <Held
                  key={team.teamId}
                  men={shown ? (byFixture.get(fixture.id) ?? []) : []}
                  align={team.teamId === sides[0]?.team.teamId ? "text-left" : "text-right"}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The score, or the state where there is not one yet.
 *
 *  Its own three lines rather than the fixture scale, which colours a club's OPPOSITION
 *  with FPL's difficulty on it — a different question with a different subject.
 *  A dash apiece before kick-off rather than `0-0`: an unplayed match has no
 *  score, and a nought is a claim (DESIGN §7). */
function Score({ fixture }: { fixture: Fixture }) {
  return (
    <span className="numeric shrink-0 text-sm font-bold text-info lg:text-base">
      {fixture.status === "upcoming"
        ? "v"
        : `${fixture.homeScore ?? "\u2014"}\u2013${fixture.awayScore ?? "\u2014"}`}
    </span>
  );
}

/** One side's men in one fixture. Empty where the side holds nobody in it — and
 *  empty too where his eleven is not public, because naming the men he has in a
 *  match is naming men in his squad. */
function Held({
  men,
  align,
}: {
  men: readonly { code: number; name: string }[];
  align: string;
}) {
  if (men.length === 0) return <div />;
  return (
    <ul className={`flex min-w-0 flex-col ${align}`}>
      {men.map((man) => (
        <li key={man.code} className="min-w-0 truncate text-2xs text-muted lg:text-xs">
          {man.name}
        </li>
      ))}
    </ul>
  );
}
