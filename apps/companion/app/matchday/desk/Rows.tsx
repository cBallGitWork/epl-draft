import { Club, Fixture, FootballPlayer, LiveTeamScore, PeriodPairing } from "@epl/core";
import ScoreFigure from "../../components/league/ScoreFigure";
import { londonDay, londonTime } from "../../londonTime";

// The desk's two kinds of line, at the density the desk is for.
//
// Split from the page when it crossed the file ceiling, and they were the half
// worth moving: the page is orchestration — which reads, which league, which
// round — and these are the typography.
//
// The FIGURE is shared with every other scoreline in the app — `ScoreFigure`
// holds the dash-not-nought and trailing-dims rule, and this note used to say a
// third occurrence would earn it. The front page's splash was the third, so it
// was earned and taken. The row AROUND the figure is still deliberately its own:
// that card is a tap target with a labelled second line, and these are wall rows
// with no chrome and nothing to tap.

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

/** One match, one line, with the vidiprinter's two conventions. */
export function Match({
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
      <span className="w-9 shrink-0 text-right text-2xs font-bold uppercase">
        {fixture.status === "live" ? (
          <span className="text-live">{fixture.minutes}′</span>
        ) : fixture.status === "finished" ? (
          <span className="text-faint">FT</span>
        ) : fixture.kickoff !== null ? (
          /* The day, in the tick's slot, which is empty until a match starts.
             Eighteen rows spanning Friday to Monday otherwise print 17:30 above
             14:00 with nothing to say they are different days. */
          <span className="text-faint">{londonDay(fixture.kickoff)}</span>
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
