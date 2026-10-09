import {
  clubById,
  nextFixtures,
  predictedEleven,
  squadOf,
  xiFault,
  londonDayAndDate,
  londonMoment,
  ordinal,
} from "@epl/core";
import TabEmpty from "../../../components/league/TabEmpty";
import ButtonLink from "../../../components/shell/ButtonLink";
import ClubShell from "./Shell";
import Squad from "./Squad";
import { squadOrder } from "./squadOrder";
import { TABLE } from "../../PremNav";
import { intelSquads, intelXi } from "../../../intel";
import { PANEL } from "@/app/desk";
import { clubOr404 } from "./club";
import { clubPlaces } from "../../places";
import { leagueOpinions } from "../../leagueOpinions";
import { weekMinutes } from "../../../xmins";

// One club's squad, the screen every club name in this section links to.
// FPL's `squad_number` is null on every element, so there is no shirt number to sort by.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export default async function ClubSquadPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, snapshot, fixtures } = await clubOr404(code);
  const league = await leagueOpinions();

  const place = clubPlaces(fixtures, snapshot.clubs).get(club.id);

  // `squadOf` drops the departed and leaves the order to the caller.
  const squad = squadOf(snapshot, club.id).sort(squadOrder(league, (code) => intelSquads.get(code)?.depthTier));

  // The season's fixtures, not the round in view: a blank gameweek can put the next match weeks off.
  const [next] = nextFixtures(fixtures, clubById(snapshot), club.id, 1);
  const against =
    next === undefined
      ? null
      : `v ${next.club.shortName}` +
        (next.fixture.kickoff === null ? "" : ` · ${londonDayAndDate(next.fixture.kickoff)}`);

  // xMins for the club's next match week, not the round in view.
  const gameweek = next?.fixture.gameweek ?? null;
  const minutes = weekMinutes(gameweek, squad.map((player) => player.code));

  // Scout's latest eleven, always drawn with when it was updated (Craig, 23 Sep 2026).
  // `xiFault` refuses only a broken one: a pitch with ten men on it is the failure nobody notices.
  const predicted = intelXi.clubs[club.shortName];
  const eleven = xiFault(predicted) === null ? predictedEleven(predicted) : [];
  const updated = intelXi.fetchedAt === null ? null : londonMoment(intelXi.fetchedAt);

  return (
    <ClubShell club={club} current="squad">
      <section className={PANEL}>
        {squad.length === 0 ? (
          <TabEmpty>FPL names {club.name} but lists nobody on its books.</TabEmpty>
        ) : (
          <>
            <Squad
              players={squad}
              league={league}
              minutes={gameweek === null || minutes === null ? null : { gameweek, byCode: minutes }}
              club={club}
              eleven={eleven}
              formation={predicted?.formation ?? null}
              against={against}
              updated={updated}
            />
            {/* No paragraph explaining the order (Craig, 5 Sep 2026). */}
          </>
        )}
      </section>

      {/* The club's standing as a button, as `cm9900/25.jpg`'s foot row draws it. */}
      <ButtonLink href={TABLE}>
        {place === undefined ? "Back to the table" : `${ordinal(place)} in the Premiership`}
      </ButtonLink>
    </ClubShell>
  );
}
