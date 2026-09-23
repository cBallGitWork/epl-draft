import {
  clubById,
  clubColours,
  nextFixtures,
  predictedEleven,
  squadOf,
  xiFault,
  londonDayAndDate,
  londonTime,
} from "@epl/core";
import TabEmpty from "../../../components/league/TabEmpty";
import ButtonLink from "../../../components/shell/ButtonLink";
import ClubShell from "./Shell";
import Squad from "./Squad";
import { fantasyDepth } from "./SquadTable";
import { TABLE } from "../../PremNav";
import { intelSquads, intelXi } from "../../../intel";
import { PANEL } from "@/app/desk";
import { clubOr404, leagueOpinions, standing } from "./club";
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
  const { club, snapshot, fixtures } = await clubOr404(code);
  const league = await leagueOpinions();

  const place = standing(fixtures, snapshot.clubs, club);

  // The third caller arrived — Set Pieces — so the filter pair moved to
  // `football/selectors.ts` as this note said it would. `squadOf` drops the
  // departed (`onTheBooks`) and leaves the order to whoever asked, which is what
  // varies between the three tabs.
  const squad = squadOf(snapshot, club.id)
    // Our league's position first, then what he has actually done inside it —
    // so each block reads as a depth chart rather than an alphabet.
    .sort(
      (a, b) =>
        fantasyDepth(league.get(a.code)) - fantasyDepth(league.get(b.code)) ||
        // **Depth before minutes.** The sister's chart says who is first choice
        // within his club and position, which is the question a squad list
        // answers; minutes only approximates it and gets a returning first
        // choice wrong all season. A man it has no tier for sorts after the men
        // it does, rather than into the first-choice block.
        depth(intelSquads.get(a.code)?.depthTier) - depth(intelSquads.get(b.code)?.depthTier) ||
        b.season.minutes - a.season.minutes ||
        b.season.starts - a.season.starts ||
        a.name.localeCompare(b.name),
    );

  // The predicted eleven, and only when it is a real one. `xiFault` is the same
  // check `intel-check` runs: a club that is not eleven, or a formation whose
  // places do not add up, is NAMED rather than drawn short — a pitch with ten
  // men on it is the failure nobody notices.
  // Who the eleven is against. The season's fixtures rather than the round in
  // view: a club's next match may be weeks off if its gameweek is blank.
  const [next] = nextFixtures(fixtures, clubById(snapshot), club.id, 1);
  const against =
    next === undefined
      ? null
      : `v ${next.club.shortName}` +
        (next.fixture.kickoff === null ? "" : ` · ${londonDayAndDate(next.fixture.kickoff)}`);

  // The latest eleven Scout has, always drawn, with when Scout last updated it
  // (Craig, 23 Sep 2026: "Some data better than no data", "Just have a last
  // updated date"). Only a broken eleven (`xiFault`) is refused.
  const predicted = intelXi.clubs[club.shortName];
  const eleven = xiFault(predicted) === null ? predictedEleven(predicted) : [];
  const updated =
    intelXi.fetchedAt === null
      ? null
      : `${londonDayAndDate(intelXi.fetchedAt)}, ${londonTime(intelXi.fetchedAt)}`;

  return (
    <ClubShell club={club} current="squad">
      <section className={PANEL}>
        {squad.length === 0 ? (
          <TabEmpty>FPL names {club.name} but lists nobody on its books.</TabEmpty>
        ) : (
          <>
            <Squad
              players={squad}
              colours={clubColours(club.shortName)}
              league={league}
              club={club}
              eleven={eleven}
              formation={predicted?.formation ?? null}
              against={against}
              updated={updated}
            />
            {/* **The paragraph explaining the ordering is gone** (Craig, 5 Sep
                2026). It was here on the argument that a column of dashes with
                no explanation reads as broken — true of a column of dashes, and
                this board has none: the sort is the column headings' own job,
                and two sentences of prose under a table is the thing
                `strip-unneeded-info` names. The reasoning survives where it
                belongs, in `SquadTable`'s docblock. */}
          </>
        )}
      </section>

      {/* `cm9900/25.jpg` puts the club's standing in its foot row — `6th in
          PRM`, a button rather than a caption. The row proper arrives with its
          second entry; until then this is the one way out, and it says where
          the club is on the way. */}
      <ButtonLink href={TABLE}>
        {place === null ? "Back to the table" : `${ordinal(place.place)} in the Premiership`}
      </ButtonLink>
    </ClubShell>
  );
}

/** Where a man sits in his club's depth chart, as a number to sort on.
 *
 *  Tier 0 is *unavailable* in the sister's vocabulary — out of the competition
 *  rather than injured — and those men are already dropped above, so it should
 *  never arrive. A man with no tier at all sorts after everyone who has one:
 *  absent is not first choice. */
function depth(tier: number | null | undefined): number {
  return tier === null || tier === undefined || tier === 0 ? Number.MAX_SAFE_INTEGER : tier;
}
