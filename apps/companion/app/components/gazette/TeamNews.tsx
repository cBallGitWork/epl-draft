import Image from "next/image";
import { crestUrl, type PublishedStory } from "@epl/core";
import { londonDayAndTime } from "../../londonTime";

// The team-news thread: a club, its crest, a line of context, one bullet per
// man, and at most one thing the manager actually said.
//
// Prose per club read as one sentence six times over; a bullet has nowhere to
// put filler, and a name in its own field can be set in bold without guessing.

/** The four states, ranked in SCALE and never in hue (DESIGN §4). The accent is
 *  the sheet's one print red and §3 gives it one meaning — "yours". OUT is the
 *  loud one because it is what a reader scans for. */
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
            {/* **Not `.crest`, though it is a club badge.** That selector
                restores the desk's tokens for an object that READS them — an
                inline SVG filled with `fill-league` — and `paper.css` fences it
                because it hands back the league's BRAND red inside whatever
                wears it. A raster badge reads none of those tokens and would
                only leave the brand red loose in this heading. DESIGN §5.
                No code means no crest, never a wrong one. */}
            {row.code === null ? null : (
              <span className="shrink-0">
                <Image src={crestUrl({ code: row.code })} alt="" width={28} height={28} />
              </span>
            )}
            {/* `paper-display`, not `font-display`: Archivo Narrow is the FIGURE
                face in both registers (DESIGN §6), and a club set in it is a
                name wearing a number's clothes. */}
            <span className="paper-display text-xl leading-none font-semibold text-ink">{row.club}</span>
            {/* Who they play, and when. Attached by the desk from the fixture
                list, so it cannot disagree with the prose. */}
            {row.fixture === undefined ? null : (
              <span className="font-sans text-2xs tracking-widest text-muted uppercase">
                vs {row.fixture.opponent} ({row.fixture.home ? "H" : "A"}) · {londonDayAndTime(row.fixture.kickoff)}
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
                    {/* **Unowned is marked, not left blank.** An absence
                        cannot be scanned for, and it read identically to a name
                        the bridge had failed to match. Safe to state:
                        `bridge:check` resolves all 300 rostered slots. In the
                        owner's own brackets, and in ink — `--color-info` is not
                        re-pointed by `.paper`, so cyan landed on cream as a
                        third colour and an unreadable one. */}
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

          {/* The standing absences, as one line. They are what a reader already
              knows, so they get a line and not a list. */}
          {row.alsoOut === undefined ? null : (
            <p className="pt-2 text-base leading-snug text-muted">
              <span className="font-sans text-2xs tracking-widest uppercase">Still out</span>{" "}
              {row.alsoOut.join(", ")}
            </p>
          )}

          {/* Carried from the source article and never composed. `house.ts`
              still forbids inventing one; this prints what the export holds. */}
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
