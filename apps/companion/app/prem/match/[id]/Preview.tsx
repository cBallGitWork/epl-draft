import { clubStats, leagueTable, ordinal, DASH } from "@epl/core";
import type { Club, ClubRecord, ClubStats, TableRow } from "@epl/core";
import { LABEL, QUIET_FIGURE, TONE } from "@/app/desk";
import type { Match } from "./match";

// A match not yet played: the home side's home record against the away side's away one.
// Difficulty is FPL's own rating; null prints a dash, as "no opinion" is not "average".

const FORM = 5;

export default function Preview({ match }: { match: Match }) {
  const { fixture, home, away, snapshot, season } = match;
  const table = leagueTable(season, snapshot.clubs);
  // No players: they only feed squad totals, which this block never prints.
  const stats = clubStats(season, snapshot.clubs, []);

  return (
    <div className="grid grid-cols-2 gap-2">
      <SideBlock
        club={home}
        where="Home"
        record={recordOf(stats, fixture.homeClubId, "home")}
        form={formOf(stats, fixture.homeClubId)}
        place={placeOf(table, fixture.homeClubId)}
        difficulty={fixture.homeDifficulty}
      />
      <SideBlock
        club={away}
        where="Away"
        record={recordOf(stats, fixture.awayClubId, "away")}
        form={formOf(stats, fixture.awayClubId)}
        place={placeOf(table, fixture.awayClubId)}
        difficulty={fixture.awayDifficulty}
        align="end"
      />
    </div>
  );
}

function SideBlock({
  club,
  where,
  record,
  form,
  place,
  difficulty,
  align,
}: {
  club: Club | undefined;
  where: "Home" | "Away";
  record: ClubRecord | null;
  form: readonly ("W" | "D" | "L")[];
  place: number | null;
  difficulty: number | null;
  align?: "end";
}) {
  return (
    <div className={`flex flex-col gap-1 ${align === "end" ? "items-end text-right" : ""}`}>
      <span className={LABEL}>
        {where}
        {place === null ? "" : ` · ${ordinal(place)}`}
      </span>

      {/* Dashes, never nought, for a club with no finished match at this end. */}
      <span className="numeric text-sm font-bold">
        {record === null || record.played === 0
          ? DASH
          : `${record.won}W ${record.drawn}D ${record.lost}L`}
      </span>
      <span className={QUIET_FIGURE}>
        {record === null || record.played === 0
          ? `No ${where.toLowerCase()} match played`
          : `${record.goalsFor}–${record.goalsAgainst} in ${record.played}`}
      </span>

      {/* Oldest first, as the season ran: the last five at most. */}
      <span className={`flex gap-1 ${align === "end" ? "flex-row-reverse" : ""}`}>
        {form.length === 0 ? (
          <span className={QUIET_FIGURE}>{DASH}</span>
        ) : (
          form.map((result, at) => (
            <span key={at} className={`numeric text-2xs font-bold ${TONE[result]}`}>
              {result}
            </span>
          ))
        )}
      </span>

      <span className={QUIET_FIGURE}>
        Difficulty {difficulty ?? DASH}
        <span className="sr-only"> — FPL&rsquo;s own rating</span>
      </span>

      <span className="sr-only">{club?.name ?? "Club unknown"}</span>
    </div>
  );
}

function recordOf(stats: readonly ClubStats[], clubId: number, end: "home" | "away") {
  return stats.find((row) => row.clubId === clubId)?.[end] ?? null;
}

/** The last five, taken off the END of a run that runs oldest first. */
function formOf(stats: readonly ClubStats[], clubId: number) {
  return stats.find((row) => row.clubId === clubId)?.form.slice(-FORM) ?? [];
}

/** Their place in our computed table, not FPL's unfilled `position`; null until they have played. */
function placeOf(table: readonly TableRow[], clubId: number): number | null {
  const at = table.findIndex((row) => row.clubId === clubId);
  return at === -1 || table[at].played === 0 ? null : at + 1;
}
