import type { LeagueTeam, PublishedStory } from "@epl/core";
import Column from "./Column";
import Paragraphs from "./Paragraphs";
import { londonDayAndTime } from "../../londonTime";

// The written lead, as filed.
//
// Everything else on the front page is computed from facts that update every
// thirty seconds. This is the one part somebody wrote, and it reads differently
// on purpose: a headline with wordplay in it, a deck saying the same thing
// plainly underneath so the joke is never the only thing telling you what
// happened, and paragraphs.
//
// **The byline and the filing time are not decoration.** A reader is entitled to
// know that this part of the paper is older than the numbers above it, and by
// how much — the rolling paper prints its most recent edition until the next
// one, so this can be days old and still be current, including under a moving
// scoreboard. The dateline is what makes that honest.
//
// Team names are joined here, from ids the writer returned. He is given both and
// told to return the id, because a name typed by a model is a name that goes
// stale the day somebody renames their team — and renaming your team is the
// first thing sixteen people do.

export default function Written({
  story,
  teams,
}: {
  story: PublishedStory;
  teams: readonly LeagueTeam[];
}) {
  const named = new Map(teams.map((team) => [team.teamId, team.name]));
  // Only a kind that predicts carries calls; everything else reports.
  const calls = story.kind === "round-preview" || story.kind === "predictions";

  return (
    <section className="flex flex-col">
      {/* The column runs under its standing title, the way a column does, and
          the title is a tag rather than a line on a rule — the same inverted ink
          chip the lead's kicker wears, because they are the same object. */}
      {story.byline !== "" ? (
        <p className="text-center">
          <span className="inline-block bg-ink px-2 py-1 font-sans text-2xs font-bold uppercase tracking-[0.15em] text-bg">
            {story.byline}
          </span>
        </p>
      ) : null}

      <h2 className="paper-display text-balance pt-2.5 text-center text-4xl font-black leading-[1.02] text-ink">
        {story.headline}
      </h2>
      {story.deck ? (
        <p className="pt-2 text-center text-lg italic leading-snug text-muted">{story.deck}</p>
      ) : null}

      <span className="mx-auto mt-3 h-px w-6 bg-ink" />

      {/* When it was filed — and, once the editions carry names, which edition
          it went out under. Not decoration: every other figure on this page is
          thirty seconds old and this could be days old and still be the current
          edition. A reader is entitled to know which he is reading. */}
      {story.filedAt ? (
        <p className="pt-2.5 text-center font-sans text-3xs uppercase tracking-[0.16em] text-faint">
          {story.edition !== "" ? `${story.edition} · ` : ""}Filed {londonDayAndTime(story.filedAt)}
        </p>
      ) : null}

      {/* The one block of prose on the page, so it is the one block set the way
          prose is set: newspaper columns, and a drop cap where they start. */}
      <Paragraphs
        text={story.body}
        dropcap
        className="paper-columns pt-3 text-sm leading-relaxed text-ink"
      />

      {story.ties !== undefined && story.ties.length > 0 ? (
        <div className="pt-4">
          <Column title={calls ? "He calls it" : "Tie by tie"}>
            <ul>
              {story.ties.map((tie) => (
                <li key={`${tie.homeTeamId}-${tie.awayTeamId}`} className="py-2">
                  <p className="font-sans text-2xs uppercase tracking-widest text-faint">
                    {named.get(tie.homeTeamId) ?? "—"} v {named.get(tie.awayTeamId) ?? "—"}
                    {/* A call, marked as one. An unmade call prints nothing
                        rather than a hedge. */}
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
