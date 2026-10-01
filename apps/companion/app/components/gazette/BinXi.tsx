import { clubById, isGoalkeeper, playerByCode, positionDepth, surname, type FootballSnapshot, type PublishedStory } from "@epl/core";
import PitchMarker from "../league/PitchMarker";
import PitchRows from "../league/PitchRows";

// The Bin XI as the desk printed it: the eleven nobody has, on the grass with Fantrax's points, then the
// bench and the key stats. The pitch block is Sheets.tsx's and the stats list the report sidebar's: two uses each.

const HEAD = "font-sans text-3xs font-semibold uppercase tracking-[0.16em] text-muted";

export default function BinXi({ story, snapshot }: { story: PublishedStory; snapshot: FootballSnapshot | null }) {
  const bin = story.extras?.bin;
  if (bin === undefined) return null;
  const players = snapshot === null ? new Map() : playerByCode(snapshot);
  const clubs = snapshot === null ? new Map() : clubById(snapshot);
  const rows = [...new Set(bin.xi.map((man) => man.slot))]
    .sort((a, b) => positionDepth(a) - positionDepth(b))
    .map((slot) => ({ label: slot, players: bin.xi.filter((man) => man.slot === slot) }));

  return (
    <div className="flex flex-col gap-3 pt-4">
      <p className={HEAD}>
        The Bin XI · {bin.shape} · <span className="numeric">{bin.total}</span> pts
      </p>
      {/* Stacked on a phone; the pitch beside its bench and stats at a desk, where it would fill the sheet. */}
      <div className="grid gap-3 @3xl:grid-cols-2 @3xl:gap-x-8">
        <PitchRows rows={rows} keyOf={(man) => String(man.code)} inColumn>
          {(man) => {
            const player = players.get(man.code) ?? null;
            return (
              <PitchMarker
                player={player}
                label={man.slot}
                name={player?.name ?? surname(man.name)}
                keeper={isGoalkeeper(man.slot)}
                club={player === null ? undefined : clubs.get(player.clubId)}
                // Fantrax's points for the week, as filed: the marker only prints points once a match is live.
                band={`${man.points} pts`}
                face={player ?? undefined}
                stateBox={false}
              />
            );
          }}
        </PitchRows>
        <div className="flex flex-col gap-3">
          {bin.bench.length === 0 ? null : (
            <p className="text-base leading-snug text-muted">
              <strong className="font-bold">Bench:</strong>{" "}
              {bin.bench.map((man) => `${man.name} (${man.club}) ${man.points}`).join(", ")}.
            </p>
          )}
          {bin.keyStats.length === 0 ? null : (
            <section className="flex flex-col gap-1.5 border-t pt-2" style={{ borderColor: "var(--paper-rule)" }}>
              <h4 className={HEAD}>Key stats</h4>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs leading-snug text-ink">
                {bin.keyStats.map((stat) => (
                  <div key={stat.label} className="contents">
                    <dt className="text-muted">{stat.label}</dt>
                    <dd className="numeric">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
