import type { PublishedStory } from "@epl/core";
import { yoursInk } from "../../mine";
import { HAIRLINES } from "./rules";

// Lawro's power rankings, ten in his own order: an argument, not a table of figures.

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
          </p>
          <p className="pl-7 pt-0.5 text-sm leading-snug text-muted">{rank.line}</p>
        </li>
      ))}
    </ol>
  );
}

