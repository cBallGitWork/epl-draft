import type { Club, RosteredTeam } from "@epl/core";
import { isActive, isResolved, squadInLines } from "@epl/core";
import PitchFrame from "./PitchFrame";
import PlayerSticker from "./PlayerSticker";

// A squad laid out the way it lines up.
//
// The rows come from counting active players per position, because Fantrax has
// no formation field — see `join/lineup.ts`. FPL solves the same problem with
// eight hardcoded row components, one per formation it allows; we cannot, since
// our position caps are commissioner-set and a 1-5-2-3 is legal here. Counting
// is both simpler and the only thing that survives a rule change.
//
// All fifteen stand on the grass, reserves behind the players in their own
// position rather than in a strip underneath. A squad is the thing a manager
// came to look at, and a reserve keeper reads as a reserve keeper when he is
// standing behind the goal. They are told apart by size and by a label, never by
// colour alone — several club colours already fail contrast on their own.

export default function Pitch({ team, clubs }: { team: RosteredTeam; clubs: Map<number, Club> }) {
  const { lines, shape } = squadInLines(team);

  return (
    <div className="flex flex-col">
      <PitchFrame>
        {lines.map((line) => (
          <ul
            key={line.position}
            // Wraps rather than shrinks: five defenders and four reserves is a
            // legal line on a 320px phone, and a squashed sticker is unreadable
            // where a second row is merely lower.
            className="flex flex-wrap items-start justify-center gap-1.5"
            aria-label={`${line.position} — ${line.players.length}`}
          >
            {line.players.map((rostered) => {
              const starting = isActive(rostered.slot);
              return (
                <li
                  key={rostered.slot.fantraxId}
                  className={starting ? "w-[4.6rem] max-w-[22%]" : "w-[3.4rem] max-w-[17%]"}
                >
                  <PlayerSticker
                    rostered={rostered}
                    club={isResolved(rostered) ? clubs.get(rostered.player.clubId) : undefined}
                  />
                  {starting ? null : (
                    <p className="pt-0.5 text-center font-display text-[0.5625rem] font-bold uppercase tracking-widest text-cream/70">
                      Res
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ))}
      </PitchFrame>

      <p className="px-0.5 pt-1 text-right">
        <span className="numeric text-2xs text-faint">{shape}</span>
      </p>
    </div>
  );
}
