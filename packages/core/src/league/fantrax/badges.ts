import { FANTRAX_BADGE_BASE } from "../../config";
import type { RawStandingsPage } from "./standingsPage";

// The badge each manager picked for his team, off Fantrax's own standings page.
//
// One of two mappers over that payload — `mapStandings` reads the table on the
// same page — which is why its shape lives in `standingsPage.ts` and not here.

/** A fantasy team's badge, as its manager chose it on Fantrax. Ours is the
 *  league crest; this is one of the sixteen inside it. */
export interface TeamBadge {
  teamId: string;
  url: string;
}

export function mapTeamBadges(raw: RawStandingsPage): TeamBadge[] {
  return Object.entries(raw.fantasyTeamInfo ?? {}).flatMap(([teamId, info]) => {
    // A team with no badge is dropped rather than carried as an empty URL: the
    // caller's question is "is there a picture for this team", and an entry that
    // answers yes with nothing behind it is a broken image on sixteen phones.
    const url = info?.logoUrl512;
    if (url === undefined) return [];

    // And an address we are not allowed to fetch is worse than no address. The
    // image optimizer is allow-listed to `FANTRAX_BADGE_BASE` and throws on
    // anything else, so a manager who uploads his own crest would take the page
    // down rather than lose his icon. Dropped here, where it costs an initial.
    return url.startsWith(FANTRAX_BADGE_BASE) ? [{ teamId, url: sized(url) }] : [];
  });
}

/** Which size we ask their host for.
 *
 *  128 rather than what the field hands over, because **the URL Fantrax sends
 *  404s**. Probed on 20 Aug 2026 against all four of the rehearsal league's
 *  badges: `_128` and `_512` answer 200, `_256` — the size every one of their
 *  own values names — answers 404 on every one of them. Their site must build
 *  these paths itself rather than use the field it publishes.
 *
 *  128 and not 512 of the two that work: the badge is drawn at 26px, so 128
 *  covers a retina phone twice over, and it is 4.7 KB against 24 KB — sixteen of
 *  them on one screen is the difference between 75 KB and 390 KB.
 *
 *  A URL that is not shaped like theirs is passed through untouched. A size we
 *  guessed onto a path we have never seen would be an invented asset. */
const SIZE = 128;
const SIZED = /_\d+\.webp$/;

function sized(url: string): string {
  return SIZED.test(url) ? url.replace(SIZED, `_${SIZE}.webp`) : url;
}
