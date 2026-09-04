import Inbox from "../Inbox";
import { inbox } from "../newsItems";
import { playerStories } from "../dossier";
import NoProfile from "../NoProfile";
import PlayerShell from "../PlayerShell";
import { subject } from "../subject";

// Championship Manager's `Injuries & Bans`, under a name a manager would look
// for. CM's word is right in a game that suspends you for a fifth booking; ours
// answers the same question — can he play — and then says what is being said
// about him.
//
// **Fantrax's stories and nothing else** (Craig, 4 Sep 2026: "Remove the FPL
// part"). FPL publishes one availability line, and that is a STATE rather than a
// story — whether he can play, which the badge and the pitch already answer
// through `availabilityOf`. Putting it in a list of dated reports made the newest
// item a sentence saying nothing had happened.
//
// The history comes from `getPlayerProfile?tab=NEWS_NOTES` — every story with its
// full body and its full analysis. Still not read: `miscData.icons[]`, which
// carries the same lines truncated with an ellipsis, and the profile's own
// `latestNews`, which is one sentence of the newest with the analysis gated.

export const revalidate = 30;

export default async function PlayerNews({
  params,
  searchParams,
}: {
  params: Promise<{ fantraxId: string }>;
  /** Which story is open. **In the URL and not in state**, so a story can be
   *  linked, and so the page stays a server component — the whole inbox is one
   *  read and a client boundary here would ship the list twice. `?story=` for
   *  the same reason every other query on the desk is spelled out. */
  searchParams: Promise<{ story?: string }>;
}) {
  const [{ fantraxId }, { story }] = await Promise.all([params, searchParams]);
  const found = await subject(fantraxId);
  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

  return (
    <PlayerShell
      subject={found}
      fantraxId={fantraxId}
      current="news"
    >
      {/* Championship Manager's news screen: a dated row per item, newest first,
          and the newest opened underneath. Every story Fantrax's provider has
          filed about him since 1 July. */}
      <Inbox
        items={inbox(await playerStories(fantraxId, new Date()))}
        href={(id) => `/players/${fantraxId}/news?story=${encodeURIComponent(id)}`}
        openId={story}
      />
    </PlayerShell>
  );
}
