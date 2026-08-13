import Link from "next/link";
import {
  FANTRAX_LEAGUE_ID,
  FANTRAX_LEAGUES,
  FantraxError,
  LEAGUE_NAME,
  fetchStandings,
  mapStandings,
} from "@epl/core";
import type { StandingsRow } from "@epl/core";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import { londonDate } from "../londonTime";
import { orRefusal, tell } from "../refusals";
import type { Unavailable } from "../refusals";

// The table. Fantrax computes it — the record and the points are theirs, and this
// page never adds them up itself.

// Must match `PAGE_REVALIDATE` in core config — see the note on the home route.
export const revalidate = 30;

const DRAFT_DATE = londonDate(
  FANTRAX_LEAGUES.find((l) => l.leagueId === FANTRAX_LEAGUE_ID)?.draftDate ?? "",
);

/** An empty table and an unreachable one are different states, and only one of
 *  them is a problem: our real league answers `[]` here every day until 10 Oct. */
async function table(): Promise<StandingsRow[] | Unavailable> {
  const raw = await orRefusal(fetchStandings(FANTRAX_LEAGUE_ID));
  return raw instanceof FantraxError ? { unavailable: tell(raw) } : mapStandings(raw);
}

export default async function StandingsPage() {
  const rows = await table();

  if ("unavailable" in rows) {
    return (
      <Nothing title="Fantrax is not answering" code={rows.unavailable}>
        The table is theirs to keep, and we cannot read it right now. Nothing here is computed
        from our side, so there is no stale copy to fall back on.
      </Nothing>
    );
  }

  if (rows.length === 0) {
    return (
      <Nothing title="No table yet" code="getStandings → 0 rows">
        {LEAGUE_NAME} drafts on {DRAFT_DATE}. A table needs teams in it, and Fantrax has none to
        rank.
      </Nothing>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="Table" />

      <div className="flex items-center gap-3 px-3 text-2xs font-bold uppercase tracking-widest text-faint">
        <span className="w-5">#</span>
        <span className="flex-1">Team</span>
        {/* Fantrax's own three-part record, and their word for the third part.
            Unparsed here as it is in the mapper: every sample we hold is "0-0-0"
            and splitting it would be inventing a format. */}
        <span className="numeric w-16 text-right">W-L-T</span>
        <span className="numeric w-14 text-right">Points</span>
      </div>

      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li key={row.teamId}>
            <Link
              href={`/squad/${row.teamId}`}
              className="elev flex min-h-14 items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 hover:bg-raised"
            >
              <span className="numeric w-5 text-sm text-faint">{row.rank}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{row.teamName}</span>
              <span className="numeric w-16 text-right text-sm text-muted">{row.record}</span>
              <span className="numeric w-14 text-right font-bold">{row.pointsFor}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
