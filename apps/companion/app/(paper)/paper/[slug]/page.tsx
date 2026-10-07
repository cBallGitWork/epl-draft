import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readerTeamId } from "../../../squads";
import { edition } from "../../../edition";
import { filed } from "../../../paper";
import { clubById } from "@epl/core";
import Extras from "../../../components/gazette/Extras";
import Folio from "../../../components/gazette/Folio";
import { named } from "../../../components/gazette/named";
import Written from "../../../components/gazette/Written";
import { KICKER } from "../../../components/gazette/kickers";

// One story, printed whole, off the uncomposed `filed`: a story the front page has dropped keeps its address.
// The archive is not read, so a slug that falls off `paper.json` 404s.

// Must match `ARTICLE_REVALIDATE` (not `PAGE_REVALIDATE`) in the app's config: Next reads this statically.
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
  // The deck, never the punning headline; the picture is `opengraph-image.tsx`.
  return {
    title: story.headline,
    description: story.deck,
    openGraph: { type: "article", title: story.headline, description: story.deck },
    twitter: { card: "summary_large_image", title: story.headline, description: story.deck },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const story = find((await params).slug);
  if (story === null) notFound();

  // A column returns team ids; names are joined at render.
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
