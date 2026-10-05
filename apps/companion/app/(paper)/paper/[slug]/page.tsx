import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readerTeamId } from "../../../squads";
import { edition } from "../../../edition";
import { filed } from "../../../paper";
import { sharePicture } from "../../../sharePicture";
import { clubById } from "@epl/core";
import Extras from "../../../components/gazette/Extras";
import Folio from "../../../components/gazette/Folio";
import { named } from "../../../components/gazette/named";
import Written from "../../../components/gazette/Written";
import { KICKER } from "../../../components/gazette/kickers";

// One story, printed whole.
//
// **The page a headline turns to.** Every teaser on the front page links here,
// which is what a paper does and what the front page could not do while the
// Gazetta was a single route.
//
// It reads the UNCOMPOSED `filed`, deliberately: `composePaper` decides what
// leads the front page today, and a story it has dropped is still a story at
// its own address. An article keeps printing under its own filed date long
// after the front page has moved on, which is the whole difference between a
// page and a feed.
//
// The archive is not read here. `paper.json` keeps the most recent stories and
// nothing has ever fallen off it; when one does, its slug 404s until an archive
// reader exists. Recorded rather than built, because the app has no runtime
// filesystem reads at all and adding one for a case that has not happened is
// machinery for nothing.

// Must match `ARTICLE_REVALIDATE` in the app's config, NOT `PAGE_REVALIDATE` — an
// article is published by a deploy rather than by a revalidation, because the
// prose is static-imported and baked into the bundle. Next analyses this
// statically, so it cannot be imported. The front page keeps the shorter window;
// its scoreboard is the one thing here that moves in thirty seconds.
export const revalidate = 300;
// No `generateStaticParams`: the layout's live strip calls `connection()`, and a prebuilt article 500s at runtime.

function find(slug: string) {
  return filed.find((story) => story.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const story = find((await params).slug);
  if (story === null) return { title: "Not in this edition" };
  // The deck and never the headline: the headline is wordplay, and a pun with
  // no article under it is not a description.
  const picture = sharePicture(story);
  const images = picture ? [picture] : undefined;
  return {
    title: story.headline,
    description: story.deck,
    openGraph: { type: "article", title: story.headline, description: story.deck, images },
    twitter: { card: picture ? "summary_large_image" : "summary", title: story.headline, description: story.deck, images },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const story = find((await params).slug);
  if (story === null) notFound();

  // The same read the front page makes, for the same reason: a column returns
  // team IDS and the names are joined at render, because a name typed by a
  // model goes stale the day somebody renames their team.
  const mine = await readerTeamId();
  const paper = await edition(mine);
  const who = named(paper.teams);

  return (
    <>
      <Folio section={KICKER[story.kind]} at={story.filedAt} />
      <article className="pt-4">
        <Written story={story} teams={paper.teams} clubs={paper.snapshot ? clubById(paper.snapshot) : undefined} />
        <Extras story={story} named={who} mine={paper.mine} snapshot={paper.snapshot} />
      </article>
    </>
  );
}
