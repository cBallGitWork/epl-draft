import Link from "next/link";
import {
  type Club,
  type Fixture,
  type FootballPlayer,
  type LiveTeamScore,
  type PeriodPairing,
  clubById,
  fixturesInOrder,
  pairingInvolves,
  periodPairings,
  roundState,
} from "@epl/core";
import AutoRefresh from "../../components/shell/AutoRefresh";
import RoundWord from "../../components/league/RoundWord";
import { footballNow, pollSeconds } from "../../football";
import { londonTime } from "../../londonTime";
import { liveScores } from "../../scoreboard";
import { getLeagueSquads } from "../../squads";
import { marksFor } from "../../involvement";
import { myTeamId } from "../../session";
import { yoursFirst } from "../../mine";

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
// No seventh tab. Six already brushes the 320px clip `matchdayfit` measures, so
// this is reached from the Live tab and nowhere else.

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
  const period = league?.period.period ?? null;
  const pairings =
    league?.info != null && period !== null
      ? periodPairings(league.info.matchups, league.info.teams, period)
      : [];

  const mine = league === null ? null : await myTeamId(league.period.teams);
  const { scores } = period === null ? { scores: new Map<string, LiveTeamScore>() } : await liveScores(period);

  const involved = league === null ? undefined : (await marksFor(league, fixtures)).mine;

  return (
    <div className="flex flex-col gap-4">
      <AutoRefresh seconds={pollSeconds(snapshot)} />

      <header className="flex items-baseline justify-between gap-3 pt-1">
        <h1 className="text-xl font-bold tracking-tight">The desk</h1>
        <span className="text-2xs font-bold uppercase tracking-widest text-faint">
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
      <h2 className="pb-1 text-2xs font-bold uppercase tracking-widest text-faint">{title}</h2>
      <div className="flex flex-col divide-y divide-line border-y border-line">{children}</div>
    </section>
  );
}

function Quiet({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-center text-xs text-muted">{children}</p>;
}

/** One head-to-head, one line. Denser than `PairingCard` — no card, no padding,
 *  no tap target — so it is a copy of that grammar rather than a reuse of it
 *  (rule of 2/3: two occurrences, and they render at different sizes for
 *  different reading distances). */
function Pairing({
  pairing,
  scores,
  mine,
}: {
  pairing: PeriodPairing;
  scores: Map<string, LiveTeamScore>;
  mine: string | null;
}) {
  const home = scores.get(pairing.home.teamId)?.points ?? null;
  const away = scores.get(pairing.away.teamId)?.points ?? null;

  return (
    <div className="flex items-baseline gap-2 py-1 text-xs">
      <Name name={pairing.home.name} mine={pairing.home.teamId === mine} />
      <span className="numeric shrink-0 font-bold tabular-nums">
        <Points points={home} other={away} /> <span className="text-faint">–</span>{" "}
        <Points points={away} other={home} />
      </span>
      <Name name={pairing.away.name} mine={pairing.away.teamId === mine} align="end" />
    </div>
  );
}

function Name({
  name,
  mine,
  align = "start",
}: {
  name: string;
  mine: boolean;
  align?: "start" | "end";
}) {
  return (
    <span
      className={`min-w-0 flex-1 truncate ${align === "end" ? "text-right" : ""} ${
        mine ? "font-bold text-accent" : "text-muted"
      }`}
    >
      {name}
    </span>
  );
}

/** A dash for a total Fantrax did not give, never a nought — and the trailing
 *  side dims, the same reading as every other scoreline in the app. */
function Points({ points, other }: { points: number | null; other: number | null }) {
  const behind = points !== null && other !== null && points < other;
  return <span className={behind ? "text-muted" : "text-ink"}>{points ?? "—"}</span>;
}

/** One match, one line, with the vidiprinter's two conventions. */
function Match({
  fixture,
  clubs,
  yours,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  yours?: FootballPlayer[];
}) {
  const home = clubs.get(fixture.homeClubId)?.shortName ?? "—";
  const away = clubs.get(fixture.awayClubId)?.shortName ?? "—";
  const played = fixture.homeScore !== null && fixture.awayScore !== null;

  return (
    <div className="flex items-baseline gap-2 py-1 text-xs">
      <span className={`min-w-0 flex-1 truncate ${yours ? "font-bold text-accent" : "text-muted"}`}>
        {home} <span className="text-faint">v</span> {away}
      </span>
      <span className="numeric shrink-0 font-bold tabular-nums">
        {played ? (
          <>
            {spelled(fixture.homeScore)}
            <span className="text-faint">–</span>
            {spelled(fixture.awayScore)}
          </>
        ) : (
          <span className="font-normal text-muted">
            {fixture.kickoff === null ? "TBC" : londonTime(fixture.kickoff)}
          </span>
        )}
      </span>
      {/* The tick where the kickoff time used to be. No HT: FPL publishes a
          minute and a finished flag, and a clock stopped on 45 is not a claim
          they have made — a match genuinely in its 45th minute reads the same. */}
      <span className="w-9 shrink-0 text-right text-2xs font-bold uppercase tracking-wide">
        {fixture.status === "live" ? (
          <span className="text-live">{fixture.minutes}′</span>
        ) : fixture.status === "finished" ? (
          <span className="text-faint">FT</span>
        ) : null}
      </span>
    </div>
  );
}

/** How many a side has to put past you before the vidiprinter says it twice.
 *
 *  Four. Not a number of ours: it is the threshold the Sky teleprinter has used
 *  for decades, and the whole joke is that the machine stops trusting you to
 *  believe the digit. */
const SPELL_FROM = 4;

const WORDS = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];

/** `4` becomes `4 (FOUR)`. A **football** fact only: there is no equivalent for
 *  a fantasy total, because "a lot of points" has no custom behind it and
 *  inventing a threshold for one would be us making the joke rather than
 *  quoting it.
 *
 *  Above nine the digit stands alone. Ten past a Premier League side is not a
 *  scoreline this needs to have an opinion about. */
function spelled(goals: number | null) {
  if (goals === null) return null;
  const word = goals >= SPELL_FROM ? WORDS[goals] : undefined;
  return (
    <span className="px-0.5">
      {goals}
      {word ? <span className="pl-1 text-2xs font-bold text-faint">({word})</span> : null}
    </span>
  );
}
