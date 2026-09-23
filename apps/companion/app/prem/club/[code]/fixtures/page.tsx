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
//
// **The Premier League only, and the page says so.** FPL publishes one
// competition — `/api/fixtures/` is the league and nothing else — so there is no
// cup or European tie to show and no honest way to imply one. A club's real
// fixture list has both, and the index block down the left is already the shape
// that carries the answer: it prints `GW7` now and would print the competition
// beside the round when a feed that knows about them arrives. Naming the limit
// on screen is the difference between a list that is incomplete and a list that
// is wrong.

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
          <>
            <Run fixtures={run} club={club} clubs={clubById(snapshot)} />
            <p className="text-2xs text-faint">
              Premier League only — FPL publishes no cup or European tie. The other competitions
              arrive with the sister repo&apos;s <span className="whitespace-nowrap">team
              match log</span>, whose competition column is what the column on the right is
              waiting for.
            </p>
          </>
        )}
      </section>
    </ClubShell>
  );
}
