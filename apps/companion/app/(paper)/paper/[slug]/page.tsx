import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readerTeamId } from "../../../squads";
import { edition } from "../../../edition";
import { filed } from "../../../paper";
import Extras from "../../../components/gazette/Extras";
import Folio from "../../../components/gazette/Folio";
import { named } from "../../../components/gazette/named";
import Written from "../../../components/gazette/Written";
import Pages from "../../../components/gazette/Pages";
import { pageOf } from "../../../components/gazette/paperPages";

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

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically,
// so it cannot be imported.
export const revalidate = 30;

export function generateStaticParams() {
  return filed.map((story) => ({ slug: story.slug }));
}

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
  return { title: story.headline, description: story.deck };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  // A static segment beats a dynamic one in Next, so `/paper/reports` is the
  // reports page and never a story slugged "reports". Slugs are `gw{n}-…` in
  // any case; the collision cannot arise.
  const story = find((await params).slug);
  if (story === null) notFound();

  // The same read the front page makes, for the same reason: a column returns
  // team IDS and the names are joined at render, because a name typed by a
  // model goes stale the day somebody renames their team.
  const mine = await readerTeamId();
  const paper = await edition(mine);
  const who = named(paper.teams);

  const page = pageOf(story.kind);

  return (
    <>
      <Folio
        section={page?.label ?? "The Gazetta"}
        number={page?.number ?? 1}
        at={story.filedAt}
      />
      <Pages here={page?.href ?? "/"} />

      {/* `Written` and not a second copy of it. Page 2 and page 3 print their
          own lead through it as well — byline chip, headline, deck, ornament,
          dateline, two columns of prose and the tie-by-tie block — and hand-
          rolling that here would be a second layout to keep in step, which is
          the drift the whole `components/gazette` folder exists to avoid.

          The FRONT page no longer prints an article at all: `Splash` there is
          this component's opening block minus the prose, plus the link that
          arrives here. Two components and not one variant, because what they
          have in common is five lines of markup and what differs is whether a
          reader has chosen to read yet. */}
      <article className="pt-4">
        <Written story={story} teams={paper.teams} />
        <Extras story={story} named={who} mine={paper.mine} />
      </article>
    </>
  );
}
