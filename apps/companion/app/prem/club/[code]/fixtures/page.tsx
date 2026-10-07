import { clubById, seasonRun } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import { PANEL_ROWS } from "../../../Shell";
import ClubShell from "../Shell";
import Run from "../Run";
import { clubOr404 } from "../club";
import { intelCups } from "@/app/intel";
import { PANEL } from "@/app/desk";

// The club's season on one screen, league and cups, played and to come: oldest first, the way it was played.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export default async function ClubFixturesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, snapshot, fixtures } = await clubOr404(code);

  const run = seasonRun(
    fixtures.filter((fixture) => fixture.homeClubId === club.id || fixture.awayClubId === club.id),
    intelCups.get(club.code) ?? [],
  );

  return (
    <ClubShell
      club={club}
      current="fixtures"
      empty={run.length === 0 ? ["fixtures"] : []}
    >
      <section
        className={PANEL}
        style={{ minHeight: `calc(${PANEL_ROWS} * var(--table-row) + var(--table-chrome))` }}
      >
        {run.length === 0 ? (
          <TabEmpty>FPL has published no match with {club.name} in it.</TabEmpty>
        ) : (
          <Run
            entries={run}
            club={club}
            clubs={clubById(snapshot)}
            byCode={new Map(snapshot.clubs.map((entry) => [entry.code, entry]))}
          />
        )}
      </section>
    </ClubShell>
  );
}
