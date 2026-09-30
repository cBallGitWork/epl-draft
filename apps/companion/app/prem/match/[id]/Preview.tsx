import { clubStats, leagueTable, ordinal, DASH } from "@epl/core";
import type { Club, ClubRecord, ClubStats, TableRow } from "@epl/core";
import { LABEL, QUIET_FIGURE, TONE } from "@/app/desk";
import type { Match } from "./match";

// A match nobody has played yet.
//
// **Each side's record is the half that will actually apply** — the home club's
// home record against the away club's away one. `docs/ui/prem.md` already ruled
// this for the club page's Match tab: a whole-season figure either side compares
// two numbers neither of which is about this fixture.
//
// **The difficulty is FPL's own and is labelled as theirs.** `Fixture` carries
// their 1-5 rating for each side and its docblock says why we are willing to
// print it at all — difficulty is an opinion, and the only defensible one is the
// one the whole fantasy world is already reading. Null is a real answer and
// prints a dash rather than a 3: "no opinion" and "average" are different claims.
//
// Nothing here is predicted and nothing is ours. A predicted eleven exists in
// `data/intel/xi/`, is filed per round, and belongs to the tab that draws
// elevens rather than to a summary — it arrives with the line-ups.

const FORM = 5;

export default function Preview({ match }: { match: Match }) {
  const { fixture, home, away, snapshot, season } = match;
  const table = leagueTable(season, snapshot.clubs);
  // No players passed, on `/prem`'s own precedent: that argument exists to add
  // up each club's SQUAD, and handing over six hundred men to have their seasons
  // summed for a block that prints a record and a form guide is work with no
  // reader.
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

      {/* A club with no finished match yet has no record to state, and an
          opening weekend is exactly when this screen is read. Dashes, never
          nought: a nought here would say they played and drew a blank. */}
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

      {/* Oldest first everywhere a form guide appears, which is `ClubStats`'
          own rule — left to right is the direction the season ran. The last five
          of a run that may be shorter. */}
      <span className={`flex gap-1 ${align === "end" ? "flex-row-reverse" : ""}`}>
        {form.length === 0 ? (
          <span className={QUIET_FIGURE}>—</span>
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

/** Where the table puts them — ours, computed off finished fixtures, which is
 *  what `/prem` does and FPL's own `position` field is not (it sits beside a
 *  `played` of nought on all twenty). Null before a ball is kicked. */
function placeOf(table: readonly TableRow[], clubId: number): number | null {
  const at = table.findIndex((row) => row.clubId === clubId);
  return at === -1 || table[at].played === 0 ? null : at + 1;
}
