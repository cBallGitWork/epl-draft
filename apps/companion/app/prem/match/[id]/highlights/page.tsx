import { YOUTUBE_EMBED_BASE } from "@epl/core";
import Nothing from "../../../../components/shell/Nothing";
import MatchShell from "../Shell";
import { readMatch } from "../match";
import { matchHighlight } from "../../../../matchFeed";
import { PANEL } from "@/app/desk";

// The match's highlights, from Sky Sports Premier League's YouTube playlist (Craig, 11 Sep 2026).
// Embedded, never fetched: YouTube's iframe plays it, and we read only titles and ids.

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
      {/* Wrapped so `MatchShell`'s `[&>section]:flex-1` misses it and the panel fits the video. */}
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
              {/* `max-w-full` on the 16:9 box, or the page scrolls sideways to hold it. */}
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
