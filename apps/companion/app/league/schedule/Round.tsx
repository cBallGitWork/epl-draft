import { LEAGUE_COMPETITION, type CompetitionTie, groupTies } from "@epl/core";
import RoundHeader from "./RoundHeader";
import Tie from "./Tie";
import type { ScheduleRound } from "./schedule";
import { HEAD_PLATE, MINOR_CAPS } from "@/app/desk";

/** One gameweek: its deadline, and every tie being played on it. */
export default function Round({
  round,
  ties,
  points,
  badges,
  places,
  mine,
}: {
  round: ScheduleRound;
  ties: CompetitionTie[];
  points: Map<string, number | null>;
  badges: Map<string, string>;
  places: Map<string, number>;
  mine: string | null;
}) {
  if (ties.length === 0) return null;

  return (
    <section className="flex flex-col gap-1">
      <RoundHeader round={round} />
      {groupTies(ties).map((group) => (
        <div key={`${group.competition.id}-${group.round ?? ""}`} className="flex flex-col">
          {/* The competition's own head, in the chrome face, the way CM captions
              a block inside a panel. The LEAGUE's block is unheaded: a schedule
              of which nine rows in ten are the league would be a column of one
              repeated word, and the two lines a cup round adds are exactly the
              rows that need naming. */}
          {group.competition.id === LEAGUE_COMPETITION.id && group.round === null ? null : (
            <h3 className={`${HEAD_PLATE} ${MINOR_CAPS}`}>
              {group.round === null
                ? group.competition.name
                : `${group.competition.name} · ${group.round}`}
              <span className="pl-2 font-normal opacity-70">Placeholder draw</span>
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
