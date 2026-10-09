import { DASH, type PublishedStory } from "@epl/core";
import { yoursInk } from "../../mine";
import { HAIRLINES } from "./rules";

// A column's ten in its own order (the power rankings, Lawro's predicted table): an argument, not a table of figures.

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
    <ol className={`flex flex-col pt-3 ${HAIRLINES}`}>
      {ranks.map((rank, at) => (
        <li key={rank.teamId} className="py-2">
          <p className="flex items-baseline gap-2">
            <span className="numeric w-5 shrink-0 text-center text-faint">{at + 1}</span>
            <span
              className={`min-w-0 flex-1 truncate font-semibold ${yoursInk(
                rank.teamId === mine,
              )}`}
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
 *  paper's own absence rule, and a nought here would read as a score. A table with no last time prints none. */
function Move({ places }: { places: number | undefined }) {
  if (places === undefined) return null;
  if (places === 0) {
    return <span className="numeric shrink-0 text-2xs text-faint">{DASH}</span>;
  }
  // Direction in the mark rather than in colour: green up and red down would
  // spend the sheet's one red on an opinion about a fantasy team.
  return (
    <span className="numeric shrink-0 text-2xs text-muted">
      {places > 0 ? `▲ ${places}` : `▼ ${Math.abs(places)}`}
    </span>
  );
}
