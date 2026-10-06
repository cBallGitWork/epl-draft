import { clubById } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import { PANEL_ROWS } from "../../../Shell";
import ClubShell from "../Shell";
import Run from "../Run";
import { clubOr404 } from "../club";
import { PANEL } from "@/app/desk";

// The club's season on one screen — what it has played and what it has left, in
// the order the season runs.
//
// **Oldest first, unlike `/prem/results`.** That page is an archive and a reader
// arriving on a Monday wants the newest round at the top. This is one club's
// campaign, which is read the way it was played: August at the top, May at the
// bottom, with the line between done and to come falling wherever the season is.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (`scripts/revalidate.test.ts`
// holds the two together.)
export const revalidate = 30;

export default async function ClubFixturesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, snapshot, fixtures } = await clubOr404(code);

  // Undated last, which is where a match the television has not picked belongs:
  // it is not "before everything", which is where a null sorts by accident.
  const run = fixtures
    .filter((fixture) => fixture.homeClubId === club.id || fixture.awayClubId === club.id)
    .sort((a, b) => {
      if (a.kickoff === null || b.kickoff === null) {
        return a.kickoff === null ? (b.kickoff === null ? 0 : 1) : -1;
      }
      return a.kickoff.localeCompare(b.kickoff);
    });

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
          <Run fixtures={run} club={club} clubs={clubById(snapshot)} />
        )}
      </section>
    </ClubShell>
  );
}
