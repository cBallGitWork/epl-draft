import Link from "next/link";
import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type LeagueInfo,
  type PeriodPairing,
  fetchFixtures,
  fetchLeagueInfo,
  mapFixtures,
  mapLeagueInfo,
  periodGameweeks,
  periodPairings,
} from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import PageHeader from "../../components/shell/PageHeader";
import SectionNav from "../SectionNav";
import { londonDate } from "../../londonTime";
import { orRefusal, tell } from "../../refusals";
import type { Unavailable } from "../../refusals";

// The whole season's head-to-heads, period by period. Fantrax's schedule, read
// from its own description of the competition — we never generate a fixture list,
// because who plays whom is a commissioner setting like everything else here.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** The competition and the football calendar it runs against.
 *
 *  Season-wide fixtures rather than the snapshot's single gameweek: this page
 *  labels all 38 periods, and the snapshot only ever holds one. They are supplied
 *  to `periodGameweeks` as plain kickoffs, which is the seam — the league layer is
 *  told about the football calendar and never reaches for it. */
async function schedule(): Promise<Schedule | Unavailable> {
  const [raw, fixtures] = await Promise.all([
    orRefusal(fetchLeagueInfo(FANTRAX_LEAGUE_ID)),
    fetchFixtures(),
  ]);
  if (raw instanceof FantraxError) return { unavailable: tell(raw) };

  const info = mapLeagueInfo(raw);
  const kickoffs = mapFixtures(fixtures).flatMap((fixture) =>
    fixture.gameweek === null || fixture.kickoff === null
      ? []
      : [{ gameweek: fixture.gameweek, kickoff: fixture.kickoff }],
  );

  // The clock is read here rather than in the component, which is both the lint
  // rule and the right shape: a render is meant to be reproducible, and fetching
  // is already the place where this page touches the world.
  const now = Date.now();

  return {
    info,
    gameweeks: new Map(
      periodGameweeks(info.scoringPeriods, kickoffs).map((p) => [p.period, p.gameweeks]),
    ),
    current:
      info.scoringPeriods.find(
        (period) => Date.parse(period.start) <= now && now <= Date.parse(period.end),
      )?.number ?? null,
  };
}

interface Schedule {
  info: LeagueInfo;
  gameweeks: Map<number, number[]>;
  /** The period today falls in, or null before the season starts — in which case
   *  nothing opens, which is honest rather than a guess at where to look. */
  current: number | null;
}

/** "Gameweek 4", "Gameweeks 4 & 5", or nothing at all. A period with no gameweek
 *  in it is a real answer — an international break — and one with two is a double.
 *  Neither is worth inventing a label for. */
function gameweekLabel(gameweeks: number[] | undefined): string | null {
  if (!gameweeks || gameweeks.length === 0) return null;
  if (gameweeks.length === 1) return `Gameweek ${gameweeks[0]}`;
  return `Gameweeks ${gameweeks.join(" & ")}`;
}

function Pairing({ pairing }: { pairing: PeriodPairing }) {
  return (
    <li className="flex items-center gap-2 px-3 py-1.5 text-sm">
      <Link href={`/squad/${pairing.home.teamId}`} className="min-w-0 flex-1 truncate text-right hover:underline">
        {pairing.home.name}
      </Link>
      <span className="text-2xs font-bold uppercase tracking-widest text-faint">v</span>
      <Link href={`/squad/${pairing.away.teamId}`} className="min-w-0 flex-1 truncate hover:underline">
        {pairing.away.name}
      </Link>
    </li>
  );
}

export default async function SchedulePage() {
  const read = await schedule();

  if ("unavailable" in read) {
    return (
      <div className="flex flex-col gap-3">
        <PageHeader title="Schedule" />
        <SectionNav current="schedule" />
        <Nothing title="Fantrax is not answering" code={read.unavailable}>
          The schedule is part of the league&apos;s own description of itself, and we cannot read it
          right now.
        </Nothing>
      </div>
    );
  }

  const { info, gameweeks, current } = read;
  const periods = info.scoringPeriods.map((period) => ({
    number: period.number,
    start: period.start,
    pairings: periodPairings(info.matchups, info.teams, period.number),
    label: gameweekLabel(gameweeks.get(period.number)),
  }));
  const played = periods.filter((period) => period.pairings.length > 0);

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="Schedule" sub={info.name} />
      <SectionNav current="schedule" />

      {played.length === 0 ? (
        <Nothing title="No fixtures yet" code={`${periods.length} periods, 0 pairings`}>
          Fantrax describes the calendar but pairs nobody in it. A schedule needs teams, and until
          the draft there are none to pair.
        </Nothing>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {played.map((period) => (
            <li key={period.number}>
              {/* Native disclosure: thirty-eight periods is a lot to scroll, and a
                  list that opens without JavaScript opens on a bad connection. */}
              <details
                open={period.number === current}
                className="elev overflow-hidden rounded-xl border border-line bg-surface"
              >
                <summary className="flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-raised">
                  <span className="numeric w-8 shrink-0 text-sm font-bold">P{period.number}</span>
                  <span className="min-w-0 flex-1 truncate text-2xs uppercase tracking-widest text-faint">
                    {period.label ?? "No gameweek"}
                  </span>
                  <span className="shrink-0 text-2xs text-faint">{londonDate(period.start)}</span>
                </summary>
                <ul className="border-t border-line py-1">
                  {period.pairings.map((pairing) => (
                    <Pairing key={`${pairing.home.teamId}-${pairing.away.teamId}`} pairing={pairing} />
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
