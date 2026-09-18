import Image from "next/image";
import { LEAGUE_TIMEZONE, crestUrl, type PublishedStory } from "@epl/core";

// The team-news thread: a club, its crest, a line of context, then one bullet
// per man and at most one thing the manager actually said.
//
// The shape Fantasy Football Scout's own team-news articles use, because it is
// what a manager reads them for. Prose per club was tried first and read as one
// sentence six times over — a bullet has nowhere to put filler, and a name in
// its own field is a name the page can set in bold without guessing.

/** The four states, and the one colour each is allowed. OUT is the print red
 *  because it is the answer a reader is scanning for; a doubt is quieter than
 *  the name beside it. */
const STATUS: Record<string, string> = {
  OUT: "text-accent",
  Suspended: "text-accent",
  Doubt: "text-muted",
  FIT: "text-ink",
};

/** "Fri 20:00" in the league's own clock, which is the only clock a reader is
 *  in. An unreadable instant prints nothing rather than "Invalid Date".
 *
 *  **"vs", and never "at" for an away tie** — Craig, 18 Sep 2026: "not at,
 *  thats american crap". Home and away is the (H)/(A) mark, which is how an
 *  English fixture list has always set it. */
function when(kickoff: string): string {
  const at = new Date(kickoff);
  if (Number.isNaN(at.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: LEAGUE_TIMEZONE,
  }).format(at);
}

export default function TeamNews({ story }: { story: PublishedStory }) {
  const rows = story.extras?.teamNews ?? [];
  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col divide-y pt-4" style={{ borderColor: "var(--paper-rule)" }}>
      {rows.map((row) => (
        <section key={row.club} className="py-4">
          <h3 className="flex items-center gap-2.5">
            {/* A crest is a printed mark and the paper's one licensed colour
                plate (DESIGN §5), so it wears `.crest` to get the desk's tokens
                back inside it. No code means no crest, never a wrong one. */}
            {row.code === null ? null : (
              <span className="crest shrink-0">
                <Image src={crestUrl({ code: row.code })} alt="" width={28} height={28} />
              </span>
            )}
            <span className="font-display text-xl leading-none font-semibold text-ink">{row.club}</span>
            {/* Who they play, and when. Attached by the desk from the fixture
                list, so it cannot disagree with the prose. */}
            {row.fixture === undefined ? null : (
              <span className="font-sans text-2xs tracking-widest text-muted uppercase">
                vs {row.fixture.opponent} ({row.fixture.home ? "H" : "A"}) · {when(row.fixture.kickoff)}
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
                    <span className={`pl-1.5 text-xs tracking-wide uppercase ${STATUS[man.status] ?? "text-muted"}`}>
                      {man.status}
                    </span>
                    {man.note === "" ? null : <span className="text-muted"> — {man.note}</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Carried from the source article and never composed. `house.ts`
              still forbids inventing one; this prints what the export holds. */}
          {row.quote === undefined ? null : (
            <blockquote
              className="mt-3 border-l-2 pl-3 text-base leading-snug"
              style={{ borderColor: "var(--paper-rule)" }}
            >
              <p className="text-ink italic">&ldquo;{row.quote.text}&rdquo;</p>
              <cite className="pt-1 block text-xs tracking-wide text-muted uppercase not-italic">
                {row.quote.said}
              </cite>
            </blockquote>
          )}
        </section>
      ))}
    </div>
  );
}
