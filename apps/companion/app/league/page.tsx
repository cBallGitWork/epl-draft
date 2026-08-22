import Link from "next/link";
import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  LEAGUE_NAME,
  fetchStandings,
  mapStandings,
} from "@epl/core";
import type { StandingsRow } from "@epl/core";
import { PLACEHOLDER_ROUNDS, playoffPlaces } from "@epl/core";
import { leagueCache } from "../leagueCache";
import AutoRefresh from "../components/shell/AutoRefresh";
import { footballNow, pollSeconds } from "../football";
import TeamBadge from "../components/league/TeamBadge";
import { teamBadges } from "../badges";
import Nothing from "../components/shell/Nothing";
import LeagueShell from "./Shell";
import { readerTeamId } from "../squads";
import { londonDate } from "../londonTime";
import { orRefusal, tell } from "../refusals";
import type { Unavailable } from "../refusals";
import { yoursBorder } from "../mine";
import { FANTRAX_SILENT, servedLeague } from "../config";

// The table. Fantrax computes it — the record and the points are theirs, and this
// page never adds them up itself.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

const DRAFT_DATE = londonDate(
  servedLeague()?.draftDate ?? "",
);

/** An empty table and an unreachable one are different states, and only one of
 *  them is a problem: our real league answers `[]` here every day until 10 Oct. */
const table = leagueCache("standings",
  async (): Promise<StandingsRow[] | Unavailable> => {
    const raw = await orRefusal(fetchStandings(FANTRAX_LEAGUE_ID));
    return raw instanceof FantraxError ? { unavailable: tell(raw) } : mapStandings(raw);
  },
);

export default async function StandingsPage() {
  const [rows, mine, badges, football] = await Promise.all([
    table(),
    readerTeamId(),
    teamBadges(),
    footballNow(),
  ]);
  // Where the season's cut falls, read off the declared bracket rather than
  // written down here — the day the placeholder becomes Fantrax's published
  // top four, this line moves with it.
  const qualify = playoffPlaces(PLACEHOLDER_ROUNDS);

  // An empty state keeps the header and the section nav. Without them a reader
  // who lands here during an outage has no way to reach Schedule or Matchups —
  // the page is a dead end rather than a section with nothing in it. Schedule
  // already did this; the table and the matchups board did not.
  if ("unavailable" in rows) {
    return (
      <LeagueShell title="Table" current="table">
        <Nothing title={FANTRAX_SILENT} code={rows.unavailable}>
          The table is theirs to keep, and we cannot read it right now. Nothing here is computed
          from our side, so there is no stale copy to fall back on.
        </Nothing>
      </LeagueShell>
    );
  }

  if (rows.length === 0) {
    return (
      <LeagueShell title="Table" current="table">
        <Nothing title="No table yet" code="getStandings → 0 rows">
          {LEAGUE_NAME} drafts on {DRAFT_DATE}. A table needs teams in it, and Fantrax has none to
          rank.
        </Nothing>
      </LeagueShell>
    );
  }

  return (
    <LeagueShell title="Table" current="table">
      {/* The FP column is Fantrax's live total and moves all weekend. This was
          the last points surface with no refresh on it at all: `revalidate`
          bounds how stale the cache may get and pushes nothing to a phone left
          open on the sofa, so the table sat still through a whole afternoon. */}
      <AutoRefresh seconds={pollSeconds(football)} />

      <div className="flex items-center gap-3 px-3 text-2xs font-bold uppercase tracking-widest text-faint">
        <span className="w-6">#</span>
        <span className="flex-1">Team</span>
        {/* Fantrax's own three-part record, and their word for the third part.
            Unparsed here as it is in the mapper: every sample we hold is "0-0-0"
            and splitting it would be inventing a format. */}
        <span className="numeric w-16 text-right">W-L-T</span>
        {/* FP, not "Points". In a league table "points" means the standings —
            three for a win — and this column is Fantrax points scored, which is
            a different number the same word would have claimed. Fantrax's own
            field is `totalPointsFor` and their site heads it FPts. */}
        <span className="numeric w-16 text-right">FP</span>
      </div>

      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li key={row.teamId}>
            <Link
              href={`/squad/${row.teamId}`}
              // Your own row takes the raised ground as well as the accent
              // edge. On sixteen near-identical rows a 4px bar at the margin is
              // easy to scroll straight past, and this is the one row a manager
              // opened the page to find.
              className={`elev flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2.5 hover:bg-raised ${
                row.teamId === mine ? "bg-raised" : "bg-surface"
              } ${yoursBorder(row.teamId === mine)}`}
            >
              {/* Rank and points are the two numbers a table is read for, and
                  both were quieter than the team name: the rank was small and
                  faint, the points bold at body size. They are the figures now,
                  set in the tabular face at either end of the row with the
                  record — which decides neither — kept small between them. */}
              <span className="numeric w-6 text-lg font-bold leading-none text-muted">
                {row.rank}
              </span>
              <TeamBadge
                team={{ teamId: row.teamId, name: row.teamName }}
                url={badges.get(row.teamId)}
              />
              <span
                className={`min-w-0 flex-1 truncate text-sm ${
                  row.teamId === mine ? "font-bold text-ink" : "font-semibold"
                }`}
              >
                {row.teamName}
              </span>
              {/* Labelled, not just accented — the border says nothing to anyone
                  who cannot see it. */}
              {row.teamId === mine ? (
                // On `bg-bg` rather than `bg-raised`: the row it sits on is now
                // raised, and a chip the same colour as its ground is not a chip.
                <span className="rounded bg-bg px-1.5 py-0.5 text-2xs font-bold uppercase tracking-widest text-accent">
                  You
                </span>
              ) : null}
              <span className="numeric w-16 text-right text-2xs text-faint">{row.record}</span>
              <span className="numeric w-16 text-right text-lg font-bold leading-none">
                {row.pointsFor}
              </span>
            </Link>
            {cut(row.rank, qualify, rows.length) ? (
              /* The playoff line. Drawn under the last qualifying place rather
                 than shaded across the rows above it: a tinted band reads as
                 "these are yours" on the one row a manager is looking for, and
                 the accent is already spoken for. Absent entirely for a league
                 that declares no playoff, and for a table shorter than the cut —
                 a line under the bottom row states a qualification nobody missed. */
              <p className="flex items-center gap-2 px-1 pt-1.5 text-2xs font-bold uppercase tracking-widest text-faint">
                <span className="h-px flex-1 bg-league/50" />
                Playoffs
                <span className="h-px flex-1 bg-league/50" />
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </LeagueShell>
  );
}

/** Whether the playoff line falls under this row.
 *
 *  Never under the last one: a line beneath the bottom of the table announces a
 *  cut nobody missed. A two-team league whose top two qualify is exactly the
 *  shape that would draw one, and the rehearsal league is four teams away from
 *  it. */
function cut(rank: number, qualify: number | null, teams: number): boolean {
  return qualify !== null && rank === qualify && rank < teams;
}
