import { now } from "../../clock";
import Section from "../../components/shell/Section";
import { playerStoryHref } from "../routes";
import { playerStories } from "./dossier";
import { NO_NEWS, StoryList } from "./Inbox";
import { inbox } from "./newsItems";

// His newest stories on the profile (Craig, 26 Sep 2026), each opening in full on the News tab.

const LATEST = 3;

export default async function LatestNews({ fantraxId }: { fantraxId: string }) {
  const items = inbox(await playerStories(fantraxId, now())).slice(0, LATEST);
  return (
    <Section title="Latest news" aside="Fantrax's own">
      {items.length === 0 ? (
        <p className="text-sm text-muted">{NO_NEWS}</p>
      ) : (
        <StoryList items={items} href={(id) => playerStoryHref(fantraxId, id)} />
      )}
    </Section>
  );
}
