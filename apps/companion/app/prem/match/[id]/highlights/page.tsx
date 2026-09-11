import { YOUTUBE_EMBED_BASE } from "@epl/core";
import Nothing from "../../../../components/shell/Nothing";
import MatchShell from "../Shell";
import { readMatch } from "../match";
import { matchHighlight } from "../../../../matchFeed";
import { PANEL } from "@/app/desk";

// The match, as the rights holder cut it.
//
// Craig, 11 Sep 2026: *"in the real match tab, replace match report tab with
// highlights"*. The commentary the Report tab held is not lost — it sits under
// the goals on the Overview, which is where it went when the two were put on one
// screen, so this takes a tab that had become a second door to the same room.
//
// **Sky Sports Premier League hold the UK rights and publish on YouTube**, and
// their playlist is the only place this looks. `highlights.ts` carries why a
// title is a JOIN rather than a search, and `docs/providers/premier-league-api.md`
// carries the counts — the short version is that a video is accepted only when
// both clubs and the score agree with this fixture.
//
// **Embedded, never fetched.** YouTube's own iframe plays the video from their
// servers; we read a list of titles and ids and nothing else.

export const revalidate = 30;

export default async function MatchHighlightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await readMatch(id);
  const { fixture, home, away } = match;

  const video =
    home === undefined || away === undefined
      ? null
      : await matchHighlight({
          home: home.name,
          away: away.name,
          homeScore: fixture.homeScore,
          awayScore: fixture.awayScore,
        });

  return (
    <MatchShell match={match} current="highlights">
      {/* **Wrapped, so the panel is the size of the video** (Craig, 11 Sep 2026:
          *"on mobile, the transparent table goes all the way down the page, just
          fll up the video space"*). `MatchShell` grows any direct `<section>`
          child to fill the screen — `[&>section]:flex-1`, which is right for a
          board that should reach the foot line and wrong for a 16:9 box: it left
          a phone's worth of empty translucent panel under the player. A `<div>`
          in between is not a `section`, so the selector does not reach it and
          the panel sizes to what is in it. */}
      <div>
        <section className={PANEL}>
          {video === null ? (
            <Nothing
              title={
                fixture.status === "upcoming"
                  ? "Not kicked off"
                  : "No highlights yet"
              }
              code={`fixture ${fixture.code}`}
            >
              {fixture.status === "upcoming"
                ? "Sky post a match's highlights after the final whistle. They will be here."
                : "Their playlist carries the last round and a half; this match is either older than that or not up yet. Nothing else on this screen is affected."}
            </Nothing>
          ) : (
            <figure className="flex flex-col gap-2">
              {/* **16:9 and `max-w-full`**, which is DESIGN's own rule for an
                `aspect-ratio` box: the player fills the panel at any width and
                the page never scrolls sideways to hold it. */}
              <div className="aspect-video w-full max-w-full overflow-hidden border border-line">
                <iframe
                  src={`${YOUTUBE_EMBED_BASE}/${video.id}`}
                  title={video.title}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  className="size-full"
                />
              </div>
              {/* Their title, verbatim and credited. It is their cut and their
                words; we are pointing at it, not republishing it. */}
              <figcaption className="text-2xs text-faint">
                {video.title} &middot; Sky Sports Premier League
              </figcaption>
            </figure>
          )}
        </section>
      </div>
    </MatchShell>
  );
}
