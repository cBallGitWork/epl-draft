import { clubColours, clubStats, ordinal } from "@epl/core";
import type { Result } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import Section from "../../../../components/shell/Section";
import ClubShell from "../Shell";
import Comparison from "../Comparison";
import Leaders from "../Leaders";
import { clubOr404, standing } from "../club";

// The club's season: where it is, how it splits home from away, and who is
// carrying it.
//
// **Home against away is the comparison `cm9900/22.jpg` sets**, and it is the
// one split worth printing for a single club: a whole-season record is already
// on the table, and the question this screen answers that the table cannot is
// whether a side travels.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

const DASH = "—";
const FORM_GAMES = 5;

export default async function ClubStatsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, snapshot, fixtures } = await clubOr404(code);

  const place = standing(fixtures, snapshot.clubs, club);
  // With the players, unlike the stub that preceded this: `squad` totals are
  // summed over whoever is passed, and an empty list made every one of them nought.
  const stats = clubStats(fixtures, snapshot.clubs, snapshot.players).find(
    (row) => row.clubId === club.id,
  );

  return (
    <ClubShell
      club={club}
      title="Stats"
      current="stats"
      empty={place === null ? ["stats"] : []}
    >
      {place === null || stats === undefined ? (
        <TabEmpty>
          FPL names {club.name} but has published no finished fixture to build a record from.
        </TabEmpty>
      ) : (
        <section className="cm-panel flex flex-col gap-3 p-2">
          <Section title="Home and away">
            <Comparison
              left={{ label: "Home" }}
              right={{ label: "Away" }}
              rows={[
                { label: "Played", left: stats.home.played, right: stats.away.played },
                { label: "Won", left: stats.home.won, right: stats.away.won },
                { label: "Drawn", left: stats.home.drawn, right: stats.away.drawn },
                { label: "Lost", left: stats.home.lost, right: stats.away.lost },
                { label: "For", left: stats.home.goalsFor, right: stats.away.goalsFor },
                { label: "Against", left: stats.home.goalsAgainst, right: stats.away.goalsAgainst },
              ]}
            />
          </Section>

          <Section title="The season">
            <dl className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
              <Figure label="Position" value={ordinal(place.place)} />
              <Figure label="Points" value={place.row.points} />
              <Figure label="Clean sheets" value={stats.cleanSheets} />
              <Figure label="Failed to score" value={stats.failedToScore} />
            </dl>
            <div className="flex items-center gap-2 px-1 pt-2">
              <span className="text-2xs uppercase text-muted">Form</span>
              <Form run={stats.form} />
            </div>
          </Section>

          <Section title="Carrying the season">
            <Leaders
              players={snapshot.players.filter((player) => player.clubId === club.id)}
              colours={clubColours(club.shortName)}
            />
          </Section>
        </section>
      )}
    </ClubShell>
  );
}

/** One figure and its name, on the fact-row shape `/players/[fantraxId]` uses. */
function Figure({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex min-h-11 items-center gap-2.5 border border-line bg-surface px-3 py-2">
      <dt className="min-w-0 flex-1 truncate text-sm text-muted">{label}</dt>
      <dd className="numeric font-bold">{value}</dd>
    </div>
  );
}

/** The last few results, newest LAST — left to right is the direction the season
 *  ran, which is how a form guide is read everywhere it appears.
 *
 *  A third copy of the run `league/TableRow` and `prem/ClubRow` both draw, and
 *  deliberately not extracted with them: those two are a five-wide column in a
 *  dense table sized to it, and this is a line of prose with a label beside it.
 *  What they share is `TONE` and the slice, which is four lines. */
function Form({ run }: { run: readonly Result[] }) {
  if (run.length === 0) return <span className="text-2xs text-faint">{DASH}</span>;
  return (
    <span className="numeric flex gap-1 text-sm font-bold">
      {run.slice(-FORM_GAMES).map((result, at) => (
        <span key={at} className={TONE[result]}>
          {result}
        </span>
      ))}
    </span>
  );
}

const TONE: Record<Result, string> = { W: "text-up", D: "text-faint", L: "text-bad" };
