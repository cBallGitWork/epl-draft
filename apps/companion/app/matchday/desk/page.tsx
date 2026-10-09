import Link from "@/app/components/shell/Link";
import {
  type LiveTeamScore,
  clubById,
  londonTime,
  fixturesInOrder,
  pairingInvolves,
  periodPairings,
  roundState,
} from "@epl/core";
import { Match, Pairing } from "./Rows";
import { headToHeadQuiet } from "./headToHead";
import RoundWord from "../../components/league/RoundWord";
import { footballNow, speaksForNow } from "../../football";
import { liveScores } from "../../scoreboard";
import { getLeagueSquads, readable, readerTeamId } from "../../squads";
import { marksFor } from "../../involvement";
import { yoursFirst } from "../../mine";
import { GAMEWEEK_HEAD, GAMEWEEK_TITLE, LABEL, PANEL } from "@/app/desk";
import { LIVE } from "../../components/shell/sections";

// Every league score and every Premier League score on one screen, read at arm's length.
// Nothing here is a link: each row is tappable elsewhere, and 44px rows would push it off one screen.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export default async function DeskPage() {
  const snapshot = await footballNow();
  const squads = await getLeagueSquads();
  const clubs = clubById(snapshot);
  const fixtures = fixturesInOrder(snapshot);

  const state = roundState(snapshot);

  // The football half needs no Fantrax: an undrafted or silent league costs the top section only.
  const league = readable(squads);
  const period = league?.roundPeriod ?? null;
  const pairings =
    league?.info != null && period !== null
      ? periodPairings(league.info.matchups, league.info.teams, period)
      : [];
  const quiet = headToHeadQuiet(squads, pairings);

  const mine = await readerTeamId();
  const { scores, refused } =
    period === null
      ? { scores: new Map<string, LiveTeamScore>(), refused: null }
      : await liveScores(period);

  const involved = league === null ? undefined : (await marksFor(league, fixtures)).mine;

  // One panel round all of it: nothing prints on the bare ground (DESIGN §2).
  return (
    <div className={PANEL}>
      <header className={GAMEWEEK_HEAD}>
        <h1 className={GAMEWEEK_TITLE}>The desk</h1>
        <span className={LABEL}>
          <RoundWord state={state} />
        </span>
      </header>

      <Section title={`Gameweek ${snapshot.gameweek} · head-to-head`}>
        {refused === null ? null : (
          <Quiet>
            Fantrax&apos;s scoreboard is not answering, so there are no points to show. The
            pairings are still right. <span className="numeric">{refused}</span>
          </Quiet>
        )}
        {quiet !== null ? (
          <Quiet>{quiet}</Quiet>
        ) : (
          yoursFirst(pairings, (p) => pairingInvolves(p, mine)).map((pairing) => (
            <Pairing
              key={`${pairing.home.teamId}-${pairing.away.teamId}`}
              pairing={pairing}
              scores={scores}
              mine={mine}
            />
          ))
        )}
      </Section>

      <Section title="The football">
        {fixtures.length === 0 ? (
          <Quiet>FPL has not named the fixtures for this gameweek.</Quiet>
        ) : (
          fixtures.map((fixture) => (
            <Match
              key={fixture.id}
              fixture={fixture}
              clubs={clubs}
              yours={involved?.get(fixture.id)}
              now={speaksForNow(snapshot)}
            />
          ))
        )}
      </Section>

      <p className="pt-1 text-center text-2xs text-faint">
        Fantrax&apos;s points above, the Premier League&apos;s scores below, updated{" "}
        {londonTime(snapshot.fetchedAt)}. Tap through from{" "}
        <Link href={LIVE} className="underline">
          Live
        </Link>{" "}
        for the elevens behind either.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col">
      <h2 className={`pb-1 ${LABEL}`}>{title}</h2>
      <div className="flex flex-col divide-y divide-line border-y border-line">{children}</div>
    </section>
  );
}

function Quiet({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-center text-xs text-muted">{children}</p>;
}
