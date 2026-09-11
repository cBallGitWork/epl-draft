import Link from "next/link";
import {
  type LiveTeamScore,
  clubById,
  fixturesInOrder,
  pairingInvolves,
  periodPairings,
  roundState,
} from "@epl/core";
import { Match, Pairing } from "./Rows";
import RoundWord from "../../components/league/RoundWord";
import { footballNow } from "../../football";
import { liveScores } from "../../scoreboard";
import { getLeagueSquads, readerTeamId } from "../../squads";
import { marksFor } from "../../involvement";
import { yoursFirst } from "../../mine";
import { GAMEWEEK_HEAD, GAMEWEEK_TITLE, LABEL } from "@/app/desk";

// The desk: every score in the league and every score in the round, on one
// screen, with nothing else on it.
//
// Jeff's wall of monitors, and the vidiprinter's conventions borrowed in voice
// and typography rather than in colour — the app's own tokens stay, because the
// colour registers are binding and Ceefax's are not ours. What is borrowed is
// the density, the tabular figures, and the two things the vidiprinter is
// actually remembered for: the spelled-out thrashing, and a tick of state where
// the kickoff time used to be.
//
// **Nothing here is a link.** It is a wall of scores, read at arm's length,
// and every row exists somewhere else as a tappable thing — the matchups list,
// the fixture list. Making 18 rows into 44px targets would cost the screen the
// one property it is for: all of it visible at once.
//
// No seventh tab. Six already brushes the 320px clip `tools/ui/navfit.mjs`
// measures, so this is reached from the Live tab and nowhere else.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function DeskPage() {
  const snapshot = await footballNow();
  const squads = await getLeagueSquads();
  const clubs = clubById(snapshot);
  const fixtures = fixturesInOrder(snapshot);

  const state = roundState(snapshot);

  // A desk with no league behind it is still a desk: the football half needs no
  // Fantrax at all, so an undrafted or silent league costs the top section and
  // nothing else.
  const league = "period" in squads ? squads : null;
  const period = league?.roundPeriod ?? null;
  const pairings =
    league?.info != null && period !== null
      ? periodPairings(league.info.matchups, league.info.teams, period)
      : [];

  const mine = await readerTeamId();
  const { scores } = period === null ? { scores: new Map<string, LiveTeamScore>() } : await liveScores(period);

  const involved = league === null ? undefined : (await marksFor(league, fixtures)).mine;

  return (
    <div className="flex flex-col gap-4">

      <header className={GAMEWEEK_HEAD}>
        <h1 className={GAMEWEEK_TITLE}>The desk</h1>
        <span className={LABEL}>
          <RoundWord state={state} />
        </span>
      </header>

      <Section title={`Gameweek ${snapshot.gameweek} · head-to-head`}>
        {pairings.length === 0 ? (
          <Quiet>Fantrax has no pairings for this period, so there is nothing to post.</Quiet>
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
          <Quiet>FPL has not named the fixtures for this round.</Quiet>
        ) : (
          fixtures.map((fixture) => (
            <Match
              key={fixture.id}
              fixture={fixture}
              clubs={clubs}
              yours={involved?.get(fixture.id)}
            />
          ))
        )}
      </Section>

      <p className="pt-1 text-center text-2xs text-faint">
        Fantrax&apos;s points above, the Premier League&apos;s scores below. Tap through from{" "}
        <Link href="/matchday" className="underline">
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
