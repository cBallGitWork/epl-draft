import type { PublishedStory } from "@epl/core";

// The power rankings' sixteen, printed as the column's own order.
//
// **It looks deliberately unlike the tables in the sidebar**, because it is a
// different kind of claim: those are arithmetic and this is an argument. So no
// aligned figure columns — a place, a name, a movement mark, and a line of
// opinion running the full width under it.

export default function Ranks({
  story,
  named,
  mine,
}: {
  story: PublishedStory;
  named: (teamId: string) => string;
  mine: string | null;
}) {
  const ranks = story.extras?.ranks ?? [];
  if (ranks.length === 0) return null;

  return (
    <ol className="flex flex-col divide-y pt-3" style={{ borderColor: "var(--paper-rule)" }}>
      {ranks.map((rank, at) => (
        <li key={rank.teamId} className="py-2">
          <p className="flex items-baseline gap-2">
            <span className="numeric w-5 shrink-0 text-right text-faint">{at + 1}</span>
            <span
              className={`min-w-0 flex-1 truncate font-semibold ${
                rank.teamId === mine ? "text-accent" : "text-ink"
              }`}
            >
              {named(rank.teamId)}
            </span>
            <Move places={rank.move} />
          </p>
          <p className="pl-7 pt-0.5 text-sm leading-snug text-muted">{rank.line}</p>
        </li>
      ))}
    </ol>
  );
}

/** Movement since the last ranking. Held is a dash and not a nought — the
 *  paper's own absence rule, and a nought here would read as a score. */
function Move({ places }: { places: number }) {
  if (places === 0) {
    return <span className="numeric shrink-0 text-2xs text-faint">—</span>;
  }
  // Direction in the mark rather than in colour: green up and red down would
  // spend the sheet's one red on an opinion about a fantasy team.
  return (
    <span className="numeric shrink-0 text-2xs text-muted">
      {places > 0 ? `▲ ${places}` : `▼ ${Math.abs(places)}`}
    </span>
  );
}
