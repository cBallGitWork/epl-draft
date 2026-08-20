import Link from "next/link";
import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  LEAGUE_NAME,
  fetchStandings,
  mapStandings,
} from "@epl/core";
import type { StandingsRow } from "@epl/core";
import { leagueCache } from "../leagueCache";
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
  const [rows, mine] = await Promise.all([table(), readerTeamId()]);

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

      <div className="flex items-center gap-3 px-3 text-2xs font-bold uppercase tracking-widest text-faint">
        <span className="w-6">#</span>
        <span className="flex-1">Team</span>
        {/* Fantrax's own three-part record, and their word for the third part.
            Unparsed here as it is in the mapper: every sample we hold is "0-0-0"
            and splitting it would be inventing a format. */}
        <span className="numeric w-16 text-right">W-L-T</span>
        <span className="numeric w-16 text-right">Points</span>
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
          </li>
        ))}
      </ul>
    </LeagueShell>
  );
}
