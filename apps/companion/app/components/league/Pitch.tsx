import type { Club, RosteredTeam } from "@epl/core";
import { lineup } from "@epl/core";
import PlayerSticker from "./PlayerSticker";

// A squad laid out the way it lines up, on an album page.
//
// The rows come from counting active players per position, because Fantrax has
// no formation field — see `join/lineup.ts`. FPL solves the same problem with
// eight hardcoded row components, one per formation it allows; we cannot, since
// our position caps are commissioner-set and a 1-5-2-3 is legal here. Counting
// is both simpler and the only thing that survives a rule change.

export default function Pitch({ team, clubs }: { team: RosteredTeam; clubs: Map<number, Club> }) {
  const { lines, bench, shape } = lineup(team);

  return (
    <div className="album overflow-hidden rounded-xl">
      <div className="p-2">
        <div className="pitch flex flex-col gap-2 px-1.5 py-2.5">
          {lines.map((line) => (
            <ul
              key={line.position}
              className="relative z-base flex justify-center gap-1.5"
              aria-label={`${line.position} — ${line.players.length}`}
            >
              {line.players.map((rostered) => (
                <li key={rostered.slot.fantraxId} className="w-[4.6rem] max-w-[22%]">
                  <PlayerSticker rostered={rostered} clubs={clubs} />
                </li>
              ))}
            </ul>
          ))}
        </div>

        <div className="flex items-baseline justify-between px-0.5 pb-1 pt-3">
          <h3 className="font-display text-2xs font-bold uppercase tracking-widest text-cream/80">
            Reserves
          </h3>
          <span className="numeric text-2xs text-cream/60">{shape}</span>
        </div>
        <ul className="flex gap-1.5">
          {bench.map((rostered) => (
            <li key={rostered.slot.fantraxId} className="w-[3.9rem]">
              <PlayerSticker rostered={rostered} clubs={clubs} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
