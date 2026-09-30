import { LEAGUE_COMPETITION, type CompetitionTie, groupTies } from "@epl/core";
import RoundHeader from "./RoundHeader";
import Tie from "./Tie";
import type { ScheduleRound } from "./schedule";
import { BLOCK_PLATE } from "@/app/desk";

/** One gameweek: its deadline, and every tie being played on it. */
export default function Round({
  round,
  ties,
  points,
  badges,
  places,
  mine,
  cup,
}: {
  round: ScheduleRound;
  ties: CompetitionTie[];
  points: Map<string, number | null>;
  badges: Map<string, string>;
  places: Map<string, number>;
  mine: string | null;
  /** Set on one cup's own list: its name is dropped, a lone round heads the gameweek, and a
   *  week with no tie can still carry a line, such as the seeding. */
  cup?: { note?: { title: string; text: string } };
}) {
  const groups = groupTies(ties);
  const note = cup?.note;
  if (groups.length === 0 && note === undefined) return null;
  const lone = cup !== undefined && groups.length === 1 ? (groups[0]?.round ?? undefined) : undefined;

  return (
    <section className="flex flex-col gap-1">
      <RoundHeader round={round} title={note?.title ?? lone} />
      {note === undefined ? null : (
        <p className="cm-rows flex min-h-11 items-center px-3 text-sm">{note.text}</p>
      )}
      {groups.map((group) => (
        <div key={`${group.competition.id}-${group.round ?? ""}`} className="flex flex-col">
          {/* The competition's own head, in the chrome face, the way CM captions
              a block inside a panel. The LEAGUE's block is unheaded: a schedule
              of which nine rows in ten are the league would be a column of one
              repeated word, and the two lines a cup round adds are exactly the
              rows that need naming. */}
          {(group.competition.id === LEAGUE_COMPETITION.id && group.round === null) ||
          lone !== undefined ? null : (
            <h3 className={BLOCK_PLATE}>
              {cup !== undefined
                ? group.round
                : group.round === null
                  ? group.competition.name
                  : `${group.competition.name} · ${group.round}`}
            </h3>
          )}
          <ul className="cm-rows flex flex-col">
            {group.ties.map((tie, at) => (
              <li key={`${tie.home.label}-${tie.away.label}-${at}`}>
                <Tie
                  tie={tie}
                  points={points}
                  badges={badges}
                  places={places}
                  round={round}
                  mine={mine}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

/** Hoisted rather than written inline: a `new Map()` in the render would be a
 *  fresh object per round, and every round but the one in play wants the same
 *  empty one. */
export const EMPTY: Map<string, number | null> = new Map();
