import { MAX_PAPER_STORIES, type PhotoCredit } from "@epl/core";

// The companion's own constants; anything a second consumer of core would need belongs in core's `config.ts`.

/** The signed session naming which team is holding the phone. */
export const TEAM_COOKIE = "team";

/** The manager's FPL entry id, unsigned: an entry id is public, and claiming another only shows his team. */
export const ENTRY_COOKIE = "fpl";

/** How long both cookies last, in seconds: one season. */
export const SEASON_IN_SECONDS = 60 * 60 * 24 * 300;

/** What a wrong sign-in code costs, in milliseconds: with no rate limiter, a slow no is a defence. */
export const WRONG_CODE_DELAY_MS = 700;

/** The paper's own name; the league's name is its publisher and prints above it. */
export const PAPER_NAME = "The Gazetta";

/** The name under the icon on a phone's home screen, where twelve characters is about all that fits. */
export const APP_SHORT_NAME = "Pro League";

/** Three colours of tokens.css as sRGB, for what cannot read a CSS variable: the theme-colour meta,
 *  the web-app manifest and its icon. Change with the tokens. */
export const TOKEN_SRGB = { bg: "#091227", league: "#c8102e", cream: "#f3eadd" } as const;

/** How many deals the front page prints; the heading says the true total. */
export const DEALS_SHOWN = 6;

/** How many men each of the Live tab's gameweek leaders lists. */
export const LEADERS_SHOWN = 5;

/** How many gameweeks of xMins a player card prints, the screen's own first. */
export const XMINS_WEEKS = 5;


/** How many filed stories run beside the lead, at the second rank. */
export const SHOULDER_STORIES = 2;

/** How many filed stories run as headlines under the lead, shoulders included: every one while the
 *  paper is verified, then 8. With no section pages, a story past the cap is linked from nowhere. */
export const HEADLINES_SHOWN = MAX_PAPER_STORIES;

/** A team to treat as the reader's own when nobody has signed in, for the test leagues, from the
 *  environment. Lent only when it is one of the served league's teams (`lentTeam`). */
export const DEMO_TEAM_ID = process.env.FANTRAX_DEMO_TEAM_ID || null;

/** What a page says when the league's own provider will not answer; each page writes its own sentence under it. */
export const FANTRAX_SILENT = "Fantrax is not answering";

/** How stale a rendered page may be, in seconds. Next reads `revalidate` statically, so every
 *  route segment repeats it as a literal; `scripts/revalidate.test.ts` holds them together. */
export const PAGE_REVALIDATE = 30;

/** How stale a printed article may be, in seconds: a story ships with the deploy that files it. */
export const ARTICLE_REVALIDATE = 300;

/** How stale Opta's commentary may be, in seconds: one request per fixture, and nothing live hangs on it. */
export const COMMENTARY_REVALIDATE = 300;

/** How stale the clubs' season stats may be, in seconds: twenty-one reads, and they move only when a match does. */
export const CLUB_SEASON_REVALIDATE = 300;

/** How stale the stats league's assist kinds may be, in seconds: a 1.3 MB read per gameweek, and
 *  the kinds only settle what FPL's own counts already pay. */
export const ASSIST_KINDS_REVALIDATE = 300;

/** How stale one day of the scoring league's counts may be, in seconds: three reads, two of them the whole pool. */
export const SCORING_DAY_REVALIDATE = 300;

/** How stale a finished period's counts in the stats league may be, in seconds: they move only on a correction, and
 *  a season's DefCon points ask for every period at once. */
export const SETTLED_PERIOD_REVALIDATE = 60 * 60 * 24;

/** Lifetime of the two reads a live score is drawn from, in seconds. Below `POLL.live` plus a
 *  fetch, or a stale-while-revalidate entry makes a lone reader see new scores every other poll. */
export const LIVE_REVALIDATE = 20;

/** How often an open page asks for a fresh render, in seconds. */
export const POLL = {
  live: 30,
  idle: 300,
} as const;

/** How long the season's Fantrax code stays good, in seconds: it changes once a year. */
export const SEASON_CODE_LIFE = 60 * 60 * 6;

/** The photograph behind every desk screen (`PhotoGround`), or null for the gameweek's own portraits. */
export const DESK_GROUND: string | null = "/ground/crowd.jpg";

/** Its credit, printed on `/credits`: CC BY-SA 4.0 requires the author, the source and the terms.
 *  Replace it with the photograph. */
export const DESK_GROUND_CREDIT: PhotoCredit | null = {
  title: "Crowd at Anfield before the match 1",
  author: "Rodhullandemu",
  licence: "CC BY-SA 4.0",
  licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  source: "https://commons.wikimedia.org/wiki/File:Crowd_at_Anfield_before_the_match_1.jpg",
};

/** The same picture at 16px wide, inline, so it paints before any request returns. Null
 *  whenever `DESK_GROUND` is. */
export const DESK_GROUND_BLUR: string | null =
  "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAgME/8QAIBAAAgICAQUBAAAAAAAAAAAAAQMCEQAEIRITM0GR4f/EABQBAQAAAAAAAAAAAAAAAAAAAAP/xAAaEQACAgMAAAAAAAAAAAAAAAAAAQIRISIx/9oADAMBAAIRAxEAPwAnag2LJLPux1fmWTsJcycmtgLPAMvuHY1EdvxQFkA0KzInURFTiFxuMuL5rCi6yhp7dP/Z";

/** A columnist who writes under his own name: how the paper bills him, and the photograph it runs
 *  beside him through the sheet's ink. Keyed by the story's `reporter`. */
export interface Columnist {
  billing: string;
  /** `focus` is where the faces sit, as an object-position, so a crop to the paper's frame keeps them. */
  photo: PhotoCredit & { src: string; alt: string; blur: string; focus: string };
  /** A square crop of the same photograph on him alone, for the banner over his column. */
  portrait: { src: string; blur: string };
  /** A 470x630 crop on him alone, cut from the original, for the card a shared link previews with. */
  card: string;
}

export const COLUMNISTS: Readonly<Record<string, Columnist>> = {
  "Mark Lawrenson": {
    billing: "Draft Expert",
    photo: {
      src: "/columnist/lawrenson-bbc.jpg",
      // His face sits in the top third of a 16:9 frame.
      focus: "50% 30%",
      alt: "Mark Lawrenson with a BBC Sport microphone",
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAYABgAAD/4QCARXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAABgAAAAAQAAAGAAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAABCgAwAEAAAAAQAAAAkAAAAA/8AAEQgACQAQAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMABgYGBgYGCgYGCg4KCgoOEg4ODg4SFxISEhISFxwXFxcXFxccHBwcHBwcHCIiIiIiIicnJycnLCwsLCwsLCwsLP/bAEMBBwcHCwoLEwoKEy4fGh8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLv/dAAQAAf/aAAwDAQACEQMRAD8A9y8TvHp+hXGzIlkRki2nad5HGD9eK1NJWO609FYHdGBG2TuOQB3rK8Xf6q2/66f1FaHhr/UXX/Xb/wBlFbOPucxN+h//2Q==",
      title: "Mark Lawrenson",
      author: "BBC Sport",
      licence: "© BBC",
      licenceUrl: "https://www.bbc.co.uk/usingthebbc/terms",
      source: "https://www.bbc.co.uk/sport",
    },
    portrait: {
      src: "/columnist/lawrenson-bbc-banner.jpg",
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAYABgAAD/4QCARXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAABgAAAAAQAAAGAAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAAqgAwAEAAAAAQAAAAoAAAAA/8AAEQgACgAKAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMABgYGBgYGCgYGCg4KCgoOEg4ODg4SFxISEhISFxwXFxcXFxccHBwcHBwcHCIiIiIiIicnJycnLCwsLCwsLCwsLP/bAEMBBwcHCwoLEwoKEy4fGh8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLv/dAAQAAf/aAAwDAQACEQMRAD8A9X1uVo/GOnW4u/LRoyxjDkAbCScqDg7hxzmu/CwMMh1IPuK8auvm8aWG7n/RLs8+u6PmuoYnJ5rpjR31FKei0P/Z",
    },
    card: "/columnist/lawrenson-bbc-card.jpg",
  },
};

/** The columnist a story is by, or null for a staff writer. */
export function columnistOf(story: { reporter?: string }): Columnist | null {
  return story.reporter === undefined ? null : (COLUMNISTS[story.reporter] ?? null);
}
