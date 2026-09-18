import Image from "next/image";
import { crestUrl, type PublishedStory } from "@epl/core";

// The team-news thread: one line per club, the crest beside it.
//
// The shape Fantasy Football Scout's own team-news articles use, because it is
// what a manager reads them for — a club, then what was said about its players.
// Not paragraphs: a reader scanning for his own men wants a list he can run an
// eye down, and prose hides the club he is looking for inside a sentence.

export default function TeamNews({ story }: { story: PublishedStory }) {
  const rows = story.extras?.teamNews ?? [];
  if (rows.length === 0) return null;

  return (
    <ul className="flex flex-col divide-y pt-3" style={{ borderColor: "var(--paper-rule)" }}>
      {rows.map((row) => (
        <li key={row.club} className="flex items-baseline gap-2.5 py-2">
          {/* A crest is a printed mark and the paper's one licensed colour plate
              (DESIGN §5), so it wears `.crest` to get the desk's tokens back
              inside it. No code means no crest rather than a wrong one. */}
          {row.code === null ? null : (
            <span className="crest relative top-0.5 shrink-0">
              <Image src={crestUrl({ code: row.code })} alt="" width={16} height={16} />
            </span>
          )}
          <p className="min-w-0 flex-1 text-sm leading-snug text-ink">
            <span className="font-semibold">{row.club}</span>
            <span className="text-muted">: </span>
            {row.line}
          </p>
        </li>
      ))}
    </ul>
  );
}
