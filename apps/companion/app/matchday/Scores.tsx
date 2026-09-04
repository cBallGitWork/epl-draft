import type { Club, Fixture, FootballPlayer, LiveTeamScore, PeriodPairing } from "@epl/core";
import ScoreFigure from "../components/league/ScoreFigure";
import Section from "../components/shell/Section";
import { londonDay, londonTime } from "../londonTime";
import { SMALL_CAPS } from "@/app/desk";

// Both competitions, one screen, at Championship Manager's own density.
//
// Craig, 4 Sep 2026: *"The table of prem matches needs proper cm rows and the
// draft matches to show too."* The Live tab had ten fixtures drawn as 54px cards
// with crests, a chevron and a stacked time-over-day — which is a fixture LIST,
// and the reference has nothing like it. `docs/ui/reference/README.md`, measured
// off the pixels: *"Rows sit straight on the ground: no card, no zebra, no gap.
// The only repeating fill is the index cell down the left."*
//
// **The draft above the football, because that is the order a manager cares
// about them in** — the same argument `matchday.md` already makes for putting
// his own tie first. Eight head-to-heads and ten matches is eighteen rows, which
// at CM's 28 is one desk screen and at the phone's 44 is a short scroll.
//
// **Not `matchday/desk/Rows`, and not yet extracted from it.** That wall draws
// the same two facts and is a different object: it is read at arm's length,
// nothing on it is a tap target, and its rows are 26px with no floor at all
// because `desk.md` makes "nothing here is a link" binding by name. These carry
// the phone's 44 and the desk's 28. Two spellings of one row is a coincidence
// (CODE_RULES §1); the third earns the extraction, and it will be the one that
// settles which of the two floors is right.

/** **No index cell, and that is a decision rather than an omission.**
 *
 *  The first build put CM's blue block down the left of both tables carrying
 *  `1..10` — a row's place in a list, which is not a fact about anything. The
 *  reference's index block always carries something: an ordinal in a league
 *  table (`cm9900/24.jpg`, where the number IS the standing), a shirt number in
 *  a squad or a ratings list (`cm3/06.jpg`, `cm9900/16.jpg`). Fifteen scorelines
 *  in kickoff order have no such number, and drawing one anyway is decoration
 *  wearing data's clothes. The wire keeps its block because the minute is real. */
function Row({ children }: { children: React.ReactNode }) {
  return <li className="flex min-h-11 items-center gap-2 lg:min-h-7">{children}</li>;
}

/** One head-to-head in our league, one line.
 *
 *  `ScoreFigure` is the shared rule and not a copy: a total Fantrax did not give
 *  is a dash, and the trailing side dims. Accent marks the reader's own team and
 *  nothing else — deliberately NOT the leader, which is `matchup.md`'s
 *  constraint and the reason five other screens can be scanned for "mine". */
export function DraftRow({
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
  const yours = pairing.home.teamId === mine || pairing.away.teamId === mine;

  return (
    <Row>
      <span
        className={`min-w-0 flex-1 truncate text-sm ${
          pairing.home.teamId === mine ? "font-bold text-accent" : "text-ink"
        }`}
      >
        {pairing.home.name}
      </span>
      <span className="numeric shrink-0 text-sm font-bold">
        <ScoreFigure points={home} other={away} /> <span className="text-faint">&ndash;</span>{" "}
        <ScoreFigure points={away} other={home} />
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-right text-sm ${
          pairing.away.teamId === mine ? "font-bold text-accent" : "text-ink"
        }`}
      >
        {pairing.away.name}
      </span>
      {/* The tick slot the football rows keep for a clock. Empty here on
          purpose: a fantasy tie has no minute of its own, and borrowing the
          round's would be a number true of neither side. */}
      <span className={`${SMALL_CAPS} w-8 shrink-0 text-right text-accent`}>
        {yours ? "You" : ""}
      </span>
    </Row>
  );
}

/** One Premier League match, one line, with the tick of state where the kickoff
 *  time used to be — the vidiprinter's own convention, and the desk's. */
export function FootballRow({
  fixture,
  clubs,
  yours,
  now,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  /** His players in this match — printed as a COUNT and never as a tint.
   *
   *  `MatchList` found this and the first build of this file ignored it: with
   *  fifteen players across ten fixtures, eight of the ten rows come out accented
   *  and every row marked is no row marked. The number is also what ranks one
   *  match above another, which a wash cannot do. */
  yours?: FootballPlayer[];
  /** Whether the snapshot is fresh enough to speak in the present tense. */
  now: boolean;
}) {
  const home = clubs.get(fixture.homeClubId)?.shortName ?? "—";
  const away = clubs.get(fixture.awayClubId)?.shortName ?? "—";
  const played = fixture.homeScore !== null && fixture.awayScore !== null;
  const live = now && fixture.status === "live";

  return (
    <Row>
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{home}</span>
      <span className="numeric shrink-0 text-sm font-bold">
        {played ? (
          <>
            {spelled(fixture.homeScore)}
            <span className="text-faint">&ndash;</span>
            {spelled(fixture.awayScore)}
          </>
        ) : (
          <span className="font-normal text-muted">
            {fixture.kickoff === null ? "TBC" : londonTime(fixture.kickoff)}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-right text-sm text-ink">{away}</span>
      <span className={`${SMALL_CAPS} w-8 shrink-0 text-right`}>
        {live ? (
          <span className="text-live">{fixture.minutes}&prime;</span>
        ) : fixture.status === "finished" ? (
          <span className="text-faint">FT</span>
        ) : fixture.kickoff !== null ? (
          <span className="text-faint">{londonDay(fixture.kickoff)}</span>
        ) : null}
      </span>
      {/* Counted rather than tinted, which is `MatchList`'s own finding: a bare
          wash saturates once fifteen players span ten fixtures, and every row
          marked is no row marked. */}
      <span className="numeric w-6 shrink-0 text-right text-2xs font-bold text-accent">
        {yours ? yours.length : ""}
      </span>
    </Row>
  );
}

export function Scores({
  pairings,
  scores,
  mine,
  fixtures,
  clubs,
  involved,
  now,
  gameweek,
}: {
  pairings: readonly PeriodPairing[];
  scores: Map<string, LiveTeamScore>;
  mine: string | null;
  fixtures: readonly Fixture[];
  clubs: Map<number, Club>;
  involved?: Map<number, FootballPlayer[]>;
  now: boolean;
  gameweek: number;
}) {
  return (
    <>
      {/* Absent rather than empty for a league with no draft yet, no schedule,
          or a Fantrax that would not answer — the football half needs none of
          them, which is what keeps "this works with no Fantrax at all" true. */}
      {pairings.length > 0 ? (
        <Section title="The draft" aside={`Gameweek ${gameweek}`}>
          <ul className="cm-rows">
            {pairings.map((p) => (
              <DraftRow
                key={`${p.home.teamId}-${p.away.teamId}`}
                pairing={p}
                scores={scores}
                mine={mine}
              />
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="The football" aside="The Premier League">
        <ul className="cm-rows">
          {fixtures.map((f) => (
            <FootballRow
              key={f.id}
              fixture={f}
              clubs={clubs}
              yours={involved?.get(f.id)}
              now={now}
            />
          ))}
        </ul>
      </Section>
    </>
  );
}

/** How many a side has to put past you before the vidiprinter says it twice.
 *
 *  Four — not a number of ours. It is the threshold Sky's teleprinter has used
 *  for decades, and the whole joke is that the machine stops trusting you to
 *  believe the digit.
 *
 *  **A deliberate copy of `matchday/desk/Rows`, not an extraction.** Second
 *  occurrence, and CODE_RULES §1 is explicit: *"Two occurrences: leave it
 *  duplicated. Two similar things are a coincidence, not a pattern."* The third
 *  earns a home, and this comment is what stops the two drifting apart in the
 *  meantime — they must agree, because the same match is on both screens.
 *
 *  **A football fact only.** There is no equivalent for a fantasy total: "a lot
 *  of points" has no custom behind it, and inventing a threshold would be us
 *  making the joke rather than quoting it. Which is why the draft table above
 *  does not call this. */
const SPELL_FROM = 4;

const WORDS = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];

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

