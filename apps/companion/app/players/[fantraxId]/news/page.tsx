import { now } from "../../../clock";
import Inbox from "../Inbox";
import { inbox } from "../newsItems";
import { playerStories } from "../dossier";
import NoProfile from "../NoProfile";
import PlayerShell from "../PlayerShell";
import { subject } from "../subject";
import { playerNewsHref } from "../../routes";

// CM's `Injuries & Bans` under a manager's word: every story Fantrax has filed about him, in Mail's frame.

export const revalidate = 30;

export default async function PlayerNews({
  params,
  searchParams,
}: {
  params: Promise<{ fantraxId: string }>;
  /** Which story is open, in the URL, so a story can be linked and the page stays a server component. */
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
      {/* A dated row per story, newest first and open beside the list on a desk. */}
      <Inbox
        items={inbox(await playerStories(fantraxId, now()))}
        list={playerNewsHref(fantraxId)}
        href={(id) => playerNewsHref(fantraxId, id)}
        openId={story}
      />
    </PlayerShell>
  );
}
