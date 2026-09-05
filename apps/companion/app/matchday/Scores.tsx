import {
  LEAGUE_COMPETITION,
  type Club,
  type CompetitionTie,
  type Fixture,
  type FootballPlayer,
  type LiveTeamScore,
  groupTies,
} from "@epl/core";
import ScoreRow from "../components/shell/ScoreRow";
import Section from "../components/shell/Section";
import FootballRow from "./FootballRow";

// Both competitions, one screen, in Championship Manager's own results row.
//
// Craig, 5 Sep 2026, with `craig/01-evening-results.jpg` attached: *"Live match rows, this is
// how champ man looks (blue box for position). scores in cyan, teams in white.
// full desktop - full team name."* `components/shell/ScoreRow` is that row, and
// it is shared with the schedule and with Results — the measurements and the one
// deliberate departure are in its docblock.
//
// **The draft above the football, because that is the order a manager cares
// about them in** — the same argument `matchday.md` already makes for putting
// his own tie first.
//
// Three things changed here beyond the row itself, all asked for in the same
// message:
//
// **The draft panel is headed by the COMPETITION, not by the word "draft"**
// (*"'The draft' should be which comp it is (we will have duel comps at
// times)"*). It takes `CompetitionTie` and `groupTies` now, which is the
// schedule's own shape, so a cup round played the same week gets its own panel
// and its own name instead of being folded into the league's eight.
//
// **The football panel lost its heading** (*"remove 'The football / The Premier
// League' line"*). Both halves of it restated what the tab and the caption above
// already say; the draft's heading survives because a competition name is a
// fact and "the football" is not.
//
// **Today only, where there is a today** (*"Maybe the live tab only shows
// matches from TODAY, to keep the space?"*). A gameweek is spread over three or
// four days and eight of the ten rows on a Sunday are about matches that
// finished yesterday. The whole round is the fallback, because a reader who
// opens this on a Tuesday must not be shown an empty panel.

/** One head-to-head in our league — or a cup tie, which is why it takes a
 *  `CompetitionTie` rather than the pairing Fantrax hands over.
 *
 *  A side nobody has been drawn into yet has no badge, no id and no link; its
 *  label is printed as the name, which is what `TieSide` is for. */
export function DraftRow({
  tie,
  scores,
  badges,
  mine,
  gameweek,
}: {
  tie: CompetitionTie;
  scores: Map<string, LiveTeamScore>;
  badges: Map<string, string>;
  mine: string | null;
  gameweek: number;
}) {
  const home = pointsOf(tie.home.team?.teamId, scores);
  const away = pointsOf(tie.away.team?.teamId, scores);
  const yours = mine !== null && (tie.home.team?.teamId === mine || tie.away.team?.teamId === mine);
  // Opened on the reader's own side when he is in it, else on the home side.
  // The board shows the same tie either way and a manager reads his own first.
  const opensOn = yours ? mine : tie.home.team?.teamId;
  // Only the LEAGUE's own ties open a board: the head-to-head route resolves its
  // pairing out of Fantrax's schedule and knows nothing about competitions, so a
  // cup tie would land on whatever league fixture those two happened to have
  // that week — a different match, with nothing on screen to say so.
  const opens = tie.competition.id === LEAGUE_COMPETITION.id && opensOn !== undefined;

  return (
    <ScoreRow
      home={side(tie, "home", badges, mine)}
      away={side(tie, "away", badges, mine)}
      // A fantasy total is a number Fantrax either has or has not; there is no
      // "not kicked off yet" for it, and `ScoreFigure`'s dash is the answer when
      // it is missing. So the score is never null here and no `pending` is
      // needed — which is the difference between this row and the football one.
      score={{ home: figure(home), away: figure(away) }}
      // **Nothing in the tail, and that is not an omission.** A fantasy tie has
      // no minute of its own, and borrowing the round's would be a number true
      // of neither side. It carried a `You` chip for a day: `mine.ts` says
      // "yours is said three ways", the accent edge and the accent name are two
      // of them already, and a third spent 48px of a 390 screen restating what
      // the row's own left edge had said.
      href={opens ? `/league/matchups/${opensOn}?gw=${gameweek}` : undefined}
    />
  );
}

export function Scores({
  ties,
  scores,
  badges,
  mine,
  fixtures,
  clubs,
  involved,
  now,
  gameweek,
}: {
  ties: readonly CompetitionTie[];
  scores: Map<string, LiveTeamScore>;
  badges: Map<string, string>;
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
      {groupTies(ties).map((group) => (
        <Section
          key={`${group.competition.id}-${group.round ?? ""}`}
          title={
            group.round === null
              ? group.competition.name
              : `${group.competition.name} · ${group.round}`
          }
        >
          <ul className="cm-rows">
            {group.ties.map((tie, at) => (
              <li key={`${tie.home.label}-${tie.away.label}-${at}`}>
                <DraftRow
                  tie={tie}
                  scores={scores}
                  badges={badges}
                  mine={mine}
                  gameweek={gameweek}
                />
              </li>
            ))}
          </ul>
        </Section>
      ))}

      {/* No heading. The tab says Live, the caption above says which gameweek and
          whether it is in play, and "The football / The Premier League" said
          neither of those things twice. */}
      <section className="cm-panel flex flex-col p-2">
        <ul className="cm-rows">
          {fixtures.map((f) => (
            <li key={f.id}>
              <FootballRow fixture={f} clubs={clubs} yours={involved?.get(f.id)} now={now} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/** One side of a draft tie, in the row's own vocabulary. */
function side(
  tie: CompetitionTie,
  at: "home" | "away",
  badges: Map<string, string>,
  mine: string | null,
) {
  const seat = tie[at];
  return {
    name: seat.label,
    badge: seat.team === null ? undefined : badges.get(seat.team.teamId),
    mine: seat.team !== null && seat.team.teamId === mine,
  };
}

function pointsOf(teamId: string | undefined, scores: Map<string, LiveTeamScore>) {
  return teamId === undefined ? null : (scores.get(teamId)?.points ?? null);
}

/** Absence, never a nought — a total Fantrax has not given us is not a nil
 *  (DESIGN §7). */
function figure(points: number | null) {
  return points === null ? <span className="text-faint">&mdash;</span> : points;
}
