import { Club, Fixture, FootballPlayer, LiveTeamScore, PeriodPairing, londonWeekday, londonTime, DASH } from "@epl/core";
import ScoreFigure from "../../components/league/ScoreFigure";
import { SMALL_CAPS } from "@/app/desk";
import { hasScore } from "../../prem/score";

// The desk's two kinds of line: wall rows with no chrome and nothing to tap.

/** One head-to-head, one line. Denser than `PairingCard` — no card, no padding,
 *  no tap target — so the row is its own even though the figure in it is not. */
export function Pairing({
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
        <ScoreFigure points={home} other={away} /> <span className="text-faint">–</span>{" "}
        <ScoreFigure points={away} other={home} />
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

/** One match, one line. */
export function Match({
  fixture,
  clubs,
  yours,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  yours?: FootballPlayer[];
}) {
  const home = clubs.get(fixture.homeClubId)?.shortName ?? DASH;
  const away = clubs.get(fixture.awayClubId)?.shortName ?? DASH;
  const played = hasScore(fixture);

  return (
    <div className="flex items-baseline gap-2 py-1 text-xs">
      <span className={`min-w-0 flex-1 truncate ${yours ? "font-bold text-accent" : "text-muted"}`}>
        {home} <span className="text-faint">v</span> {away}
      </span>
      <span className="numeric shrink-0 font-bold tabular-nums">
        {played ? (
          <>
            <span className="px-0.5">{fixture.homeScore}</span>
            <span className="text-faint">–</span>
            <span className="px-0.5">{fixture.awayScore}</span>
          </>
        ) : (
          <span className="font-normal text-muted">
            {fixture.kickoff === null ? "TBC" : londonTime(fixture.kickoff)}
          </span>
        )}
      </span>
      {/* No HT: FPL gives a minute and a finished flag, and a clock on 45 may still be running. */}
      <span className={`w-9 shrink-0 text-right ${SMALL_CAPS}`}>
        {fixture.status === "live" ? (
          <span className="text-live">{fixture.minutes}′</span>
        ) : fixture.status === "finished" ? (
          <span className="text-faint">FT</span>
        ) : fixture.kickoff !== null ? (
          /* The day, so a round spanning Friday to Monday does not read as one day's times. */
          <span className="text-faint">{londonWeekday(fixture.kickoff)}</span>
        ) : null}
      </span>
    </div>
  );
}
