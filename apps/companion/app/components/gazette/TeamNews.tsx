import Image from "next/image";
import { crestUrl, type PublishedStory, londonDayAndTime } from "@epl/core";
import { RULE } from "./rules";
import { CAPTION, CAPTION_CAPS, SUBHEAD } from "./heads";

// The team-news thread: a club, its crest and fixture, a line of context, one row per man, and at most one quote.

/** The four states, ranked in scale, never in hue (DESIGN §4); OUT is the loud one. */
const STATUS: Record<string, string> = {
  OUT: "font-semibold text-ink",
  Suspended: "font-semibold text-ink",
  Doubt: "text-muted",
  FIT: "text-muted",
};

export default function TeamNews({ story }: { story: PublishedStory }) {
  const rows = story.extras?.teamNews ?? [];
  if (rows.length === 0) return null;

  return (
    // The paper's own measure: one column on a phone, newspaper columns on a desk, a club never split across two.
    <div className="paper-columns pt-4">
      {rows.map((row) => (
        <section key={row.club} className={`break-inside-avoid border-b py-4 last:border-b-0 ${RULE}`}>
          <h3 className="flex items-center gap-3">
            {/* Not `.crest`: a raster badge reads no desk token, and `.crest` would let the brand red loose here. */}
            {row.code === null ? null : (
              <span className="shrink-0">
                <Image src={crestUrl({ code: row.code })} alt="" width={32} height={32} />
              </span>
            )}
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className={SUBHEAD}>{row.club}</span>
              {/* Who they play, and when, off the fixture list: under the name, so neither wraps beside the other. */}
              {row.fixture === undefined ? null : (
                <span className={CAPTION}>
                  v {row.fixture.opponent} ({row.fixture.home ? "H" : "A"}) · {londonDayAndTime(row.fixture.kickoff)}
                </span>
              )}
            </span>
          </h3>

          {row.line === undefined ? null : <p className="pt-2.5 text-base leading-snug text-muted">{row.line}</p>}

          {/* The status is the row's mark, in a column of its own, so the men line up under one another. */}
          {row.men === undefined ? null : (
            <ul className="grid grid-cols-[minmax(2.75rem,auto)_1fr] gap-x-3 gap-y-1.5 pt-2.5">
              {row.men.map((man) => (
                <li key={man.name} className="col-span-2 grid grid-cols-subgrid items-baseline text-base leading-snug">
                  <span className={`${CAPTION_CAPS} ${STATUS[man.status] ?? "text-muted"}`}>{man.status}</span>
                  <p className="min-w-0 text-ink">
                    <strong className="font-bold">{man.name}</strong>
                    {/* Unowned is marked, not left blank, in ink: `.paper` does not re-point `--color-info`. */}
                    <span className="text-muted"> (<em>{man.owner ?? "FA"}</em>)</span>
                    {man.note === "" ? null : <span className="text-muted"> — {man.note}</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {row.stillOut !== undefined ? (
            <StillOut men={row.stillOut} owned />
          ) : row.alsoOut !== undefined ? (
            <StillOut men={row.alsoOut.map((name) => ({ name }))} owned={false} />
          ) : null}

          {/* Carried from the source article, never composed. */}
          {row.quote === undefined ? null : (
            <blockquote className={`mt-3 border-l-2 pl-3 text-base leading-snug ${RULE}`}>
              <p className="text-ink italic">&ldquo;{row.quote.text}&rdquo;</p>
              <cite className={`${CAPTION} block pt-1 not-italic`}>
                {row.quote.said}
              </cite>
            </blockquote>
          )}
        </section>
      ))}
    </div>
  );
}

/** The standing absences run in after their label, as a paper's team news sets them; `owned` is false for a column
 *  filed before the desk said who held them. */
function StillOut({ men, owned }: { men: readonly { name: string; owner?: string }[]; owned: boolean }) {
  return (
    <p className="pt-2.5 text-base leading-snug text-muted">
      <span className={`${CAPTION_CAPS} pr-1.5 font-semibold text-ink`}>Still out</span>
      {men.map((man, at) => (
        <span key={man.name}>
          {at > 0 ? " · " : null}
          {man.name}
          {owned ? <> (<em>{man.owner ?? "FA"}</em>)</> : null}
        </span>
      ))}
    </p>
  );
}
