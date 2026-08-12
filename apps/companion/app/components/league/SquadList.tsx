import type { Club, RosteredPlayer, RosteredTeam, SquadReason } from "@epl/core";
import { isResolved, positionDepth } from "@epl/core";

// What a squad looks like before its period opens: fifteen names and nothing
// about how they will be arranged.
//
// The omissions are the feature. No active/reserve split, no formation, no
// pitch — those are the lineup, and the lineup is what the gate withholds.
// Grouping by position is safe and is not the same information: position is what
// Fantrax deems a player eligible to fill, published all week on the player
// pool, while active/reserve is this week's decision.

/** Why we are showing this instead of the pitch, in the manager's terms rather
 *  than the gate's. Every one of these is an ordinary state. */
const EXPLANATION: Record<SquadReason, string> = {
  "not-started": "Lineups appear when the gameweek starts. Everyone's, at once.",
  "unknown-period":
    "Fantrax did not say which gameweek this squad is for, so the lineup stays hidden.",
  "no-calendar": "We cannot read the league's deadlines right now, so the lineup stays hidden.",
  "period-not-in-calendar":
    "This squad names a gameweek the calendar does not have, so the lineup stays hidden.",
};

/** A slot with no position still belongs to somebody. Matches `lineup()`, which
 *  buckets the same case rather than dropping the player. */
const UNPLACED = "—";

function positionOf(rostered: RosteredPlayer): string {
  return rostered.slot.position ?? UNPLACED;
}

function nameOf(rostered: RosteredPlayer): string {
  // The Fantrax id is the last resort and is deliberately shown rather than
  // hidden: a squad slot we cannot name is still a slot the manager holds.
  return isResolved(rostered) ? rostered.player.name : rostered.slot.fantraxId;
}

/** Alphabetical within a position, and that ordering is load-bearing.
 *
 *  Fantrax currently returns roster items with active and reserve players
 *  interleaved, so rendering them in payload order happens not to leak the XI.
 *  That is their serialisation detail, not a promise: the day they sort by
 *  status, a view that trusted their order would start publishing the lineup it
 *  exists to withhold, and would do it silently. Sorting by name makes the
 *  non-leak a property of this file. */
function byName(a: RosteredPlayer, b: RosteredPlayer): number {
  return nameOf(a).localeCompare(nameOf(b));
}

export default function SquadList({
  team,
  clubs,
  because,
}: {
  team: RosteredTeam;
  clubs: Map<number, Club>;
  because: SquadReason;
}) {
  // Grouped from the squad itself and ordered by the pitch order core already
  // owns, rather than from a list of positions written out here. A letter this
  // file has never heard of still gets a group, in the same place the pitch
  // would put it.
  const groups = new Map<string, RosteredPlayer[]>();
  for (const player of team.players) {
    const position = positionOf(player);
    const group = groups.get(position);
    if (group) group.push(player);
    else groups.set(position, [player]);
  }

  const ordered = [...groups.entries()]
    .map(([position, players]) => ({ position, players: [...players].sort(byName) }))
    .sort((a, b) => positionDepth(a.position) - positionDepth(b.position));

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-muted">
        {EXPLANATION[because]}
      </p>

      {ordered.map((group) => (
        <section key={group.position} className="flex flex-col gap-1">
          <h2 className="font-display text-2xs font-bold uppercase tracking-widest text-faint">
            {group.position}
            <span className="numeric ml-1.5 font-normal text-faint">{group.players.length}</span>
          </h2>
          <ul className="flex flex-col gap-1">
            {group.players.map((rostered) => {
              const club = isResolved(rostered) ? clubs.get(rostered.player.clubId) : undefined;
              return (
                <li
                  key={rostered.slot.fantraxId}
                  className="flex min-h-11 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{nameOf(rostered)}</span>
                  {club ? (
                    <span className="numeric text-2xs tracking-widest text-faint">
                      {club.shortName}
                    </span>
                  ) : (
                    <span className="numeric rounded bg-raised px-1.5 py-0.5 text-2xs font-bold text-mid">
                      unmapped
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
