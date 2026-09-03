import { clubColours } from "@epl/core";
import TabEmpty from "../../../components/league/TabEmpty";
import ButtonLink from "../../../components/shell/ButtonLink";
import ClubShell from "./Shell";
import SquadTable from "./SquadTable";
import { clubOr404, fantraxPositions, standing } from "./club";
import { ordinal } from "@epl/core";

// One club's squad — the screen every club name in this section links to.
//
// **Ordered by minutes, and it says so on the page.** FPL gives no position and
// no shirt number (`squad_number` is a key on every element and null on all of
// them, counted 29 Aug), so minutes is the only depth signal there is. It is not
// the alphabetical order the fantasy squad board uses: that one is a GATE, it
// withholds an arrangement somebody actually picked, and there is nothing to
// withhold about a real club.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (`scripts/revalidate.test.ts`
// holds the two together.)
export const revalidate = 30;

export default async function ClubSquadPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, clubs, players, fixtures } = await clubOr404(code);
  const fantrax = await fantraxPositions();

  const place = standing(fixtures, clubs, club);
  const squad = [...players].sort(
    (a, b) =>
      b.season.minutes - a.season.minutes ||
      b.season.starts - a.season.starts ||
      a.name.localeCompare(b.name),
  );

  return (
    <ClubShell club={club} title="Squad" current="squad">
      <section className="cm-panel flex flex-col gap-2 p-2">
        {squad.length === 0 ? (
          <TabEmpty>FPL names {club.name} but lists nobody on its books.</TabEmpty>
        ) : (
          <>
            <SquadTable
              players={squad}
              colours={clubColours(club.shortName)}
              fantrax={fantrax}
            />
            {/* Said rather than left blank. A column of dashes with no
                explanation reads as broken; a column of dashes with one reads
                as early. */}
            <p className="text-2xs text-faint">
              Ordered by minutes played. Real positions and the depth chart are still to come;
              <span className="whitespace-nowrap"> Elig</span> is what our Fantrax league is
              willing to field him as, which is not the same thing.
            </p>
          </>
        )}
      </section>

      {/* `cm9900/25.jpg` puts the club's standing in its foot row — `6th in
          PRM`, a button rather than a caption. The row proper arrives with its
          second entry; until then this is the one way out, and it says where
          the club is on the way. */}
      <ButtonLink href="/prem">
        {place === null ? "Back to the table" : `${ordinal(place.place)} in the Premiership`}
      </ButtonLink>
    </ClubShell>
  );
}
