// A match's highlights from Sky Sports Premier League's YouTube playlist; embedded, never fetched or re-hosted.
// The title is a join, not a search: a video is accepted only when both clubs and the score match a fixture we hold.

/** One video, and the fixture its title claims. */
export interface HighlightVideo {
  id: string;
  title: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
}

/** Sky's spelling → FPL's `name`. Sky disagrees with itself ("N Forest", "Nottingham Forest"), so a
 *  spelling not listed fails the join rather than guessing: no video beats one on the wrong match. */
const SKY_SPELLS: Record<string, string> = {
  Hull: "Hull City",
  "N Forest": "Nott'm Forest",
  "Nottingham Forest": "Nott'm Forest",
  "B'mouth": "Bournemouth",
  Coventry: "Coventry City",
  Ipswich: "Ipswich Town",
};

/** The fixture a title claims, or null; not anchored to a leading `|`, since some titles open with prose.
 *  The capital at the start of each club keeps the pattern from swallowing that prose. */
export function parseHighlightTitle(
  title: string,
): Omit<HighlightVideo, "id" | "title"> | null {
  const found = /([A-Z][A-Za-z'’.& ]*?)\s+(\d+)\s*[-–]\s*(\d+)\s+([A-Z][A-Za-z'’.& ]*?)\s*\|/.exec(
    title,
  );
  if (found === null) return null;
  return {
    home: club(found[1]),
    away: club(found[4]),
    homeScore: Number(found[2]),
    awayScore: Number(found[3]),
  };
}

function club(said: string): string {
  const name = said.trim();
  return SKY_SPELLS[name] ?? name;
}

/** Every video in a public `videos.xml?playlist_id=…` feed (the latest 15) with its fixture; a title with none is dropped. */
export function parseHighlightFeed(xml: string): HighlightVideo[] {
  const videos: HighlightVideo[] = [];
  for (const entry of xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []) {
    const id = /<yt:videoId>([^<]*)<\/yt:videoId>/.exec(entry)?.[1];
    const title = /<media:title>([^<]*)<\/media:title>/.exec(entry)?.[1];
    if (id === undefined || title === undefined) continue;
    const fixture = parseHighlightTitle(title);
    if (fixture === null) continue;
    videos.push({ id, title, ...fixture });
  }
  return videos;
}

/** The video for one fixture by FPL club `name`: both clubs and both scores, or null; the score tells two legs apart.
 *  Never ordered on the feed's `published` dates, which do not follow the playlist. */
export function highlightFor(
  videos: readonly HighlightVideo[],
  fixture: { home: string; away: string; homeScore: number | null; awayScore: number | null },
): HighlightVideo | null {
  if (fixture.homeScore === null || fixture.awayScore === null) return null;
  return (
    videos.find(
      (video) =>
        video.home === fixture.home &&
        video.away === fixture.away &&
        video.homeScore === fixture.homeScore &&
        video.awayScore === fixture.awayScore,
    ) ?? null
  );
}
