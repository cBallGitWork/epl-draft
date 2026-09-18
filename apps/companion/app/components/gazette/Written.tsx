import type { Club, LeagueTeam, PublishedStory } from "@epl/core";
import Face from "./Face";
import Column from "./Column";
import Paragraphs from "./Paragraphs";
import Dateline from "./Dateline";

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
  clubs,
}: {
  story: PublishedStory;
  teams: readonly LeagueTeam[];
  /** The round's clubs, for the picture's kit and crest. Absent prints no
   *  picture rather than a wrong one. */
  clubs?: Map<number, Club>;
}) {
  const named = new Map(teams.map((team) => [team.teamId, team.name]));
  // Only a kind that predicts carries calls; everything else reports.
  const calls = story.kind === "round-preview" || story.kind === "predictions";

  // **A standfirst is not columnised.** `paper-columns` takes a measure rather
  // than a count, which is right for a whole article and wrong for an intro:
  // three sentences split into three 17rem columns is a shape no paper prints,
  // and it left the width a picture wanted. Craig, 18 Sep 2026 — "on desktop,
  // two columns seems weird, space for photo".
  //
  // Length cannot tell the two apart — a 666-character tie-report is a whole
  // piece and a 720-character Team Sheet is its standfirst. What tells them
  // apart is whether the ARTICLE is below: a story carrying team news or a
  // ranking has its substance in that block, and the prose above it is an
  // introduction.
  const intro = story.extras?.teamNews !== undefined || story.extras?.ranks !== undefined;

  // The men named below, so the standfirst sets them in bold too — Craig, 18 Sep
  // 2026: "bold players in the whole article". They come off the rows rather
  // than out of the prose, so only a name the desk filed can be emboldened.
  const footballers = (story.extras?.teamNews ?? []).flatMap((row) => (row.men ?? []).map((man) => man.name));
  const portrait = intro && story.face !== undefined && story.face !== null && clubs !== undefined;

  // The opening: chip, headline, deck, rule, dateline, prose. When a picture
  // runs beside it, ALL of that is the left column rather than the prose alone —
  // a 20rem portrait against three sentences left a hole the height of the
  // picture between the standfirst and the first club. Craig, 18 Sep 2026:
  // "remove the big gap between chelsea and the above paragraph".
  const opening = (
    <>
      {/* The column runs under its standing title, the way a column does, and
          the title is a tag rather than a line on a rule — the same inverted ink
          chip the lead's kicker wears, because they are the same object. */}
      {story.byline !== "" ? (
        <p>
          <span className="inline-block bg-ink px-2 py-1 font-sans text-2xs font-bold uppercase tracking-[0.15em] text-bg">
            {story.byline}
          </span>
        </p>
      ) : null}

      <h2 className="paper-display text-balance pt-2.5 text-4xl font-black leading-[1.02] text-ink @3xl:text-5xl">
        {story.headline}
      </h2>
      {story.deck ? (
        <p className="pt-2 text-lg italic leading-snug text-muted">{story.deck}</p>
      ) : null}

      <span className="mt-3 block h-px w-6 bg-ink" />

      {/* When it was filed — and, once the editions carry names, which edition
          it went out under. Not decoration: every other figure on this page is
          thirty seconds old and this could be days old and still be the current
          edition. A reader is entitled to know which he is reading. */}
      <Dateline story={story} turn={false} className="pt-2.5" />

      <Paragraphs
        text={story.body}
        dropcap
        names={footballers}
        className={`pt-3 text-base leading-relaxed text-ink ${intro || portrait ? "" : "paper-columns"}`}
      />
    </>
  );

  return (
    <section className="flex flex-col">
      {portrait && story.face ? (
        <div className="grid gap-4 @3xl:grid-cols-[1fr_16rem] @3xl:gap-6">
          <div className="flex min-w-0 flex-col">{opening}</div>
          <figure className="order-first @3xl:order-none @3xl:pt-10">
            <Face face={story.face} clubs={clubs} rank="portrait" />
            <figcaption className="pt-1.5 font-sans text-2xs uppercase tracking-widest text-faint">
              {story.face.name}
            </figcaption>
          </figure>
        </div>
      ) : (
        opening
      )}

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
