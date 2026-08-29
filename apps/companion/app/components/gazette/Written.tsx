import type { LeagueTeam, PublishedEdition } from "@epl/core";
import Column from "./Column";
import { londonDayAndTime } from "../../londonTime";

// The written column, as filed.
//
// Everything else on the front page is computed from facts that update every
// thirty seconds. This is the one part somebody wrote, twice a week, and it
// reads differently on purpose: a headline with wordplay in it, a deck saying
// the same thing plainly underneath so the joke is never the only thing telling
// you what happened, and paragraphs.
//
// **The byline and the filing time are not decoration.** A reader is entitled to
// know that this part of the paper is older than the numbers above it, and by
// how much. Every other figure on the page is thirty seconds old; this could be
// three days old and still be the current edition.
//
// Team names are joined here, from ids the writer returned. He is given both and
// told to return the id, because a name typed by a model is a name that goes
// stale the day somebody renames their team — and renaming your team is the
// first thing sixteen people do.

export default function Written({
  edition,
  teams,
}: {
  edition: PublishedEdition;
  teams: readonly LeagueTeam[];
}) {
  const named = new Map(teams.map((team) => [team.teamId, team.name]));

  return (
    <section className="flex flex-col">
      {/* The column runs under its standing title, the way a column does, and
          the title is a tag rather than a line on a rule — the same inverted ink
          chip the lead's kicker wears, because they are the same object. The
          byline IS that title here, so it is printed once: it was on the rule
          and again in the line beneath, which read as a paper introducing itself
          twice. */}
      <p className="text-center">
        <span className="inline-block bg-ink px-2 py-1 font-sans text-2xs font-bold uppercase tracking-[0.15em] text-bg">
          {edition.byline || (edition.kind === "preview" ? "The form guide" : "The back page")}
        </span>
      </p>

      <h2 className="paper-display text-balance pt-2.5 text-center text-4xl font-black leading-[1.02] text-ink">
        {edition.headline}
      </h2>
      {edition.deck ? (
        <p className="pt-2 text-center text-lg italic leading-snug text-muted">{edition.deck}</p>
      ) : null}

      <span className="mx-auto mt-3 h-px w-6 bg-ink" />

      {/* When it was filed, and it is not decoration: every other figure on this
          page is thirty seconds old and this could be three days old and still
          be the current edition. A reader is entitled to know which he is
          reading. */}
      {edition.filedAt ? (
        <p className="pt-2.5 text-center font-sans text-3xs uppercase tracking-[0.16em] text-faint">
          Filed {londonDayAndTime(edition.filedAt)}
        </p>
      ) : null}

      {/* The one block of prose on the page, so it is the one block set the way
          prose is set: newspaper columns, and a drop cap where they start. */}
      <Paragraphs
        text={edition.intro}
        dropcap
        className="paper-columns pt-3 text-sm leading-relaxed text-ink"
      />

      {edition.sections.map((section) => (
        <div key={section.key} className="pt-4">
          <p className="border-b border-line pb-1 font-sans text-2xs font-bold uppercase tracking-widest text-faint">
            {section.heading}
          </p>
          <Paragraphs text={section.body} className="pt-2 text-sm leading-relaxed text-ink" />
        </div>
      ))}

      {edition.ties.length > 0 ? (
        <div className="pt-4">
          <Column title={edition.kind === "preview" ? "He calls it" : "Tie by tie"}>
            <ul>
              {edition.ties.map((tie) => (
                <li key={`${tie.homeTeamId}-${tie.awayTeamId}`} className="py-2">
                  <p className="font-sans text-2xs uppercase tracking-widest text-faint">
                    {named.get(tie.homeTeamId) ?? "—"} v {named.get(tie.awayTeamId) ?? "—"}
                    {/* A call, marked as one. Only a preview carries these, and
                        an unmade call prints nothing rather than a hedge. */}
                    {tie.callsTeamId ? (
                      <span className="font-bold text-cream">
                        {" "}
                        · {named.get(tie.callsTeamId) ?? "—"}
                      </span>
                    ) : null}
                  </p>
                  <p className="pt-0.5 text-sm leading-snug text-muted">{tie.line}</p>
                </li>
              ))}
            </ul>
          </Column>
        </div>
      ) : null}
    </section>
  );
}

/** Paragraphs, split on blank lines. The writer is told to file them that way
 *  and a model that files one block instead costs the reader nothing but the
 *  breaks — so this splits rather than validates. */
function Paragraphs({
  text,
  className,
  /** Whether the first paragraph opens on a drop cap. The column's does and a
   *  section's does not: a drop cap says "the prose starts here", and a page
   *  that used it four times would be saying it four times. */
  dropcap = false,
}: {
  text: string;
  className?: string;
  dropcap?: boolean;
}) {
  const paragraphs = text.split(/\n\n+/).filter((paragraph) => paragraph.trim() !== "");
  if (paragraphs.length === 0) return null;

  return (
    <div className={className}>
      {paragraphs.map((paragraph, at) => (
        <p key={at} className={at > 0 ? "pt-2.5" : dropcap ? "paper-dropcap" : undefined}>
          {paragraph.trim()}
        </p>
      ))}
    </div>
  );
}
