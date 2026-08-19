import Link from "next/link";
import { unstable_cache } from "next/cache";
import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  LEAGUE_NAME,
  PAGE_REVALIDATE,
  fetchStandings,
  mapStandings,
} from "@epl/core";
import type { StandingsRow } from "@epl/core";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import SectionNav from "./SectionNav";
import { getLeagueSquads } from "../squad/league";
import { myTeamId } from "../session";
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
const table = unstable_cache(
  async (): Promise<StandingsRow[] | Unavailable> => {
    const raw = await orRefusal(fetchStandings(FANTRAX_LEAGUE_ID));
    return raw instanceof FantraxError ? { unavailable: tell(raw) } : mapStandings(raw);
  },
  ["standings", FANTRAX_LEAGUE_ID],
  { revalidate: PAGE_REVALIDATE },
);

/** Who is reading, if anyone. The table's own read does not carry team ids we
 *  can trust for this — `getStandings` names teams but the session is validated
 *  against the league's own roster — so the squads read supplies them. It is
 *  cached, so this costs a lookup rather than a request. */
async function readerTeamId(): Promise<string | null> {
  const squads = await getLeagueSquads();
  return "period" in squads ? myTeamId(squads.period.teams) : null;
}

export default async function StandingsPage() {
  const [rows, mine] = await Promise.all([table(), readerTeamId()]);

  if ("unavailable" in rows) {
    return (
      <Nothing title={FANTRAX_SILENT} code={rows.unavailable}>
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
      <SectionNav current="table" />

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
              className={`elev flex min-h-14 items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 hover:bg-raised ${yoursBorder(
                row.teamId === mine,
              )}`}
            >
              <span className="numeric w-5 text-sm text-faint">{row.rank}</span>
              <span
                className={`min-w-0 flex-1 truncate ${
                  row.teamId === mine ? "font-bold text-ink" : "font-semibold"
                }`}
              >
                {row.teamName}
              </span>
              {/* Labelled, not just accented — the border says nothing to anyone
                  who cannot see it. */}
              {row.teamId === mine ? (
                <span className="rounded bg-raised px-1.5 py-0.5 text-2xs font-bold uppercase tracking-widest text-accent">
                  You
                </span>
              ) : null}
              <span className="numeric w-16 text-right text-sm text-muted">{row.record}</span>
              <span className="numeric w-14 text-right font-bold">{row.pointsFor}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
