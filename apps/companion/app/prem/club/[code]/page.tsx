import {
  availabilityOf,
  clubById,
  clubColours,
  nextFixtures,
  predictedEleven,
  xiFault,
  xiRoundFault,
} from "@epl/core";
import TabEmpty from "../../../components/league/TabEmpty";
import ButtonLink from "../../../components/shell/ButtonLink";
import ClubShell from "./Shell";
import Squad from "./Squad";
import { fantasyDepth } from "./SquadTable";
import { TABLE } from "../../PremNav";
import { intelSquads, intelXi } from "../../../intel";
import { PANEL, SMALL_CAPS } from "@/app/desk";
import { londonDayAndDate } from "../../../londonTime";
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

  // One line rather than a `playersByClub` selector in core. **Two callers now**
  // — the Stats tab filters the same way for its leaders — and CODE_RULES §1
  // leaves two duplicated, because two similar things are a coincidence. The
  // third is what would tell us what varies, and a `football/selectors.ts` entry
  // is where it goes.
  const squad = snapshot.players
    .filter((player) => player.clubId === club.id)
    // **The unavailable are dropped, and only that one state** (Craig, 3 Sep:
    // "remove UNAV players, they are out of the game"). FPL's `u` is not a
    // doubt or a knock — it is a man who is no longer in the competition, a
    // loan out of the league or a contract expired, and he is not on this
    // club's squad list in any sense a reader cares about. The injured and the
    // suspended stay and are greyed, because a squad list that omits them
    // cannot be checked against a team sheet.
    .filter((player) => availabilityOf(player).state !== "unavailable")
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

  // **Two faults, and only one of them was checked.** `xiFault` asks whether the
  // export is a good eleven; `xiRoundFault` asks whether it is THIS round's. The
  // second is the one that fails silently — the round lives in the export's
  // filename and so in a static import, the heading beside it is `next`, and a
  // build made after the round turned drew last week's eleven under this week's
  // opponent with nothing on screen out of place.
  const predicted = intelXi.clubs[club.shortName];
  const stale = xiRoundFault(intelXi, next?.fixture.gameweek ?? null);
  const eleven =
    stale === null && xiFault(predicted) === null ? predictedEleven(predicted) : [];

  return (
    <ClubShell club={club} title="Squad" current="squad">
      <section className={PANEL}>
        {squad.length === 0 ? (
          <TabEmpty>FPL names {club.name} but lists nobody on its books.</TabEmpty>
        ) : (
          <>
            <Squad
              players={squad}
              colours={clubColours(club.shortName)}
              league={league}
              intel={intelSquads}
              club={club}
              eleven={eleven}
              formation={predicted?.formation ?? null}
              against={against}
            />
            {/* A refused eleven is SAID, not merely absent. Withholding it
                silently is better than drawing the wrong one, but a pitch that
                is simply gone reads as a club nobody has predicted — which is a
                different thing and is not true. DESIGN §7's absence grammar
                applied to a whole board rather than to a cell. */}
            {stale === null ? null : (
              <p className={`${SMALL_CAPS} text-bad`}>No predicted eleven — {stale}.</p>
            )}
            {/* Said rather than left blank. A column of dashes with no
                explanation reads as broken; a column of dashes with one reads
                as early. */}
            <p className="text-2xs text-faint">
              Ordered by the position our league files each man at, then by the depth chart.
              Players FPL has marked unavailable are not listed.
            </p>
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
