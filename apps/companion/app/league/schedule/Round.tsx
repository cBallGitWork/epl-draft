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
  places,
  mine,
  note,
}: {
  round: ScheduleRound;
  ties: CompetitionTie[];
  points: Map<string, number | null>;
  places: Map<string, number>;
  mine: string | null;
  /** A cup's line in a week it plays no tie, such as its seeding. */
  note?: { title: string; text: string } | undefined;
}) {
  const groups = groupTies(ties);
  if (groups.length === 0 && note === undefined) return null;

  return (
    <section className="flex flex-col gap-1">
      <RoundHeader round={round} />
      {groups.map((group) => (
        <div key={`${group.competition.id}-${group.round ?? ""}`} className="flex flex-col">
          {/* The league's own block is unheaded; a cup's round is named on a plate. */}
          {group.competition.id === LEAGUE_COMPETITION.id && group.round === null ? null : (
            <h3 className={BLOCK_PLATE}>
              {group.round === null ? group.competition.name : `${group.competition.name} · ${group.round}`}
            </h3>
          )}
          <ul className="cm-rows flex flex-col">
            {group.ties.map((tie, at) => (
              <li key={`${tie.home.label}-${tie.away.label}-${at}`}>
                <Tie
                  tie={tie}
                  points={points}
                  places={places}
                  round={round}
                  mine={mine}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
      {note === undefined ? null : (
        <div className="flex flex-col">
          <h3 className={BLOCK_PLATE}>{note.title}</h3>
          <p className="cm-rows flex min-h-11 items-center px-3 text-sm">{note.text}</p>
        </div>
      )}
    </section>
  );
}

/** Hoisted rather than written inline: a `new Map()` in the render would be a
 *  fresh object per round, and every round but the one in play wants the same
 *  empty one. */
export const EMPTY: Map<string, number | null> = new Map();
