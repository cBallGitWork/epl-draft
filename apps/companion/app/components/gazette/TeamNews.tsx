import Image from "next/image";
import { crestUrl, type PublishedStory, londonDayAndTime } from "@epl/core";

// The team-news thread: a club, its crest, a line of context, one bullet per man, and at most one quote.

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
    <div className="flex flex-col divide-y pt-4" style={{ borderColor: "var(--paper-rule)" }}>
      {rows.map((row) => (
        <section key={row.club} className="py-4">
          <h3 className="flex items-center gap-2.5">
            {/* Not `.crest`: a raster badge reads no desk token, and `.crest` would let the brand red loose here. */}
            {row.code === null ? null : (
              <span className="shrink-0">
                <Image src={crestUrl({ code: row.code })} alt="" width={28} height={28} />
              </span>
            )}
            {/* `paper-display`, not `font-display`: Archivo Narrow is the figure face. */}
            <span className="paper-display text-xl leading-none font-semibold text-ink">{row.club}</span>
            {/* Who they play, and when, off the fixture list. */}
            {row.fixture === undefined ? null : (
              <span className="font-sans text-2xs tracking-widest text-muted uppercase">
                v {row.fixture.opponent} ({row.fixture.home ? "H" : "A"}) · {londonDayAndTime(row.fixture.kickoff)}
              </span>
            )}
          </h3>

          <p className="pt-2 text-base leading-snug text-muted">{row.line}</p>

          {row.men === undefined ? null : (
            <ul className="flex flex-col gap-1 pt-2.5">
              {row.men.map((man) => (
                <li key={man.name} className="flex gap-2 text-base leading-snug">
                  <span aria-hidden className="text-faint">
                    ·
                  </span>
                  <p className="min-w-0 flex-1 text-ink">
                    <strong className="font-bold">{man.name}</strong>
                    {/* Unowned is marked, not left blank, in ink: `.paper` does not re-point `--color-info`. */}
                    <span className="text-muted">
                      {" "}
                      ({man.owner ?? "FA"})
                    </span>
                    <span className={`pl-1.5 font-sans text-2xs tracking-widest uppercase ${STATUS[man.status] ?? "text-muted"}`}>
                      {man.status}
                    </span>
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
            <blockquote
              className="mt-3 border-l-2 pl-3 text-base leading-snug"
              style={{ borderColor: "var(--paper-rule)" }}
            >
              <p className="text-ink italic">&ldquo;{row.quote.text}&rdquo;</p>
              <cite className="pt-1 block font-sans text-2xs tracking-widest text-muted uppercase not-italic">
                {row.quote.said}
              </cite>
            </blockquote>
          )}
        </section>
      ))}
    </div>
  );
}

/** The standing absences, a man a line; `owned` is false for a column filed before the desk said who held them. */
function StillOut({ men, owned }: { men: readonly { name: string; owner?: string }[]; owned: boolean }) {
  return (
    <div className="pt-2.5">
      <p className="font-sans text-2xs tracking-widest text-muted uppercase">Still out</p>
      <ul className="flex flex-col gap-0.5 pt-1">
        {men.map((man) => (
          <li key={man.name} className="text-base leading-snug text-muted">
            {man.name}
            {owned ? ` (${man.owner ?? "FA"})` : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
