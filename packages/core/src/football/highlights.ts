// A match's highlights, from the rights holder's own playlist.
//
// Craig, 11 Sep 2026, supplying the playlist: *"theres your playlist"*, then
// *"in the real match tab, replace match report tab with highlights"*.
//
// **Sky Sports Premier League hold the UK rights and publish on YouTube**, which
// is the fact that makes this possible and the one I had wrong when asked —
// `docs/providers/premier-league-api.md` carries the correction and the counts.
// Nothing here fetches a video: YouTube's own iframe is what gets embedded, and
// the video is never fetched or re-hosted.
//
// **The title is a JOIN and not a search**, which is the whole reason this is
// safe to ship. Every entry in that playlist carries the fixture in its title —
// `Arsenal 2-1 Chelsea`, `N Forest 0-0 Spurs` — so a candidate is accepted only
// when BOTH clubs AND the score agree with a fixture we already hold. No
// re-upload, compilation or clickbait passes that by accident, which keeps us on
// the right side of the rule the portraits decision set: a wrong one is worse
// than none, because only one of the two looks like an answer.
//
// Counted 28 Sep 2026 against the live feed: 15 of 15 titles parse and join (13 before B'mouth and Nottingham Forest).

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

/** The fixture a title claims, or null for a title that carries none.
 *
 *  **Deliberately not anchored to a leading `|`.** Fourteen of the fifteen
 *  titles put the fixture between two pipes and the fifteenth puts it at the end
 *  of the opening clause (`…in home win! 💥 Chelsea 4-3 Brighton | …`), which is
 *  the kind of thing a sample of one would have missed. Requiring a capital at
 *  the start of each club is what keeps the looser pattern from swallowing the
 *  prose in front of it. */
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

/** Every video in a YouTube playlist feed, with the fixture each title claims.
 *
 *  The feed is `videos.xml?playlist_id=…`, which is public and needs no API key
 *  — it carries the latest 15 entries, about a round and a half. Read with
 *  regexes rather than an XML parser: this is four fields of a known shape from
 *  one known producer, and a dependency for that is what CODE_RULES §1 calls a
 *  generic mechanism.
 *
 *  A title that carries no fixture is DROPPED rather than kept with nulls. A
 *  video we cannot place is a video we will never show. */
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

/** The video for one fixture, or null.
 *
 *  **Both clubs and both scores, or nothing.** The score is what makes this a
 *  join rather than a guess: two clubs meet twice a season and a title naming
 *  them could be either leg, so the scoreline is the discriminator. A goalless
 *  draw between the same pair twice in a season would defeat it — at which point
 *  we would show the earlier of two CORRECT videos for that pairing, which is a
 *  failure worth having against the alternative.
 *
 *  **Never ordered on the feed's dates.** A playlist feed's `published` is the
 *  video's own and does not sort with the playlist — Arsenal 2-1 Chelsea is
 *  dated 9 August and arrives first. Nothing here reads a date.
 *
 *  Takes FPL's own `name` for each club, which is what the parser has already
 *  normalised Sky's spellings to. */
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
