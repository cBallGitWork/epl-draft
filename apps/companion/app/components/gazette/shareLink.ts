import type { Metadata } from "next";
import type { PublishedStory } from "@epl/core";
import { PAPER_NAME } from "../../config";
import { storyHref } from "./paperPages";

// What a shared article carries: the share sheet's headline and address, and the tags a link's preview is drawn from.

/** The share sheet's payload: the headline and the article's own absolute address. */
export function shareOf(story: Pick<PublishedStory, "slug" | "headline">, origin: string): { title: string; url: string } {
  return { title: story.headline, url: new URL(storyHref(story.slug), origin).toString() };
}

/** An article's tags, described by the deck and never the punning headline; the picture is `opengraph-image.tsx`. `host`
 *  is the production domain (`VERCEL_PROJECT_PRODUCTION_URL`); without it no address prints, rather than localhost's. */
export function articleMetadata(
  story: Pick<PublishedStory, "slug" | "headline" | "deck" | "filedAt">,
  host: string | undefined,
): Metadata {
  const title = story.headline;
  const description = story.deck === "" ? undefined : story.deck;
  const url = storyHref(story.slug);
  const placed = host ? { metadataBase: new URL(`https://${host}`), alternates: { canonical: url } } : {};
  return {
    title,
    description,
    ...placed,
    openGraph: {
      type: "article",
      siteName: PAPER_NAME,
      title,
      description,
      ...(host ? { url } : {}),
      ...(story.filedAt === "" ? {} : { publishedTime: story.filedAt }),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
