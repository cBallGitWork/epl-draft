// The paper's pages, in the order they are printed.
//
// **A fixed running order and not a computed one.** A folio is a promise that
// page 2 is where page 2 was yesterday, so the number is declared here rather
// than derived from how many pages happen to have something on them. A section
// that files nothing this week keeps its number and prints its own empty line;
// renumbering the paper because a column was quiet is how "turn to page 4"
// becomes a lie.
//
// Its own file rather than a const inside `Pages.tsx`, because the folio at the
// head of each page reads the same table — two consumers on the day it lands,
// and the alternative is the drift `shell/sections.ts` exists to prevent.

export interface PaperPage {
  href: string;
  label: string;
  /** What prints in the folio, and what a teaser points at. */
  number: number;
  /** The story kinds this page prints. The front page is not filtered — it
   *  composes from everything — so it carries none. */
  kinds?: readonly string[];
}

export const PAPER_PAGES: readonly PaperPage[] = [
  { href: "/", label: "Front Page", number: 1 },
  {
    href: "/paper/reports",
    label: "Reports",
    number: 2,
    // What happened, and what is about to. `news` is here because it reports
    // football that happened elsewhere — it is a wire service item, not opinion.
    kinds: [
      "tie-report", "match-report", "tie-call", "fixture-preview",
      "round-preview", "news", "presser", "predicted-xi",
    ],
  },
  {
    href: "/paper/columns",
    label: "The Monday Club",
    number: 3,
    // The opinion columns, named for the edition they file under
    // (`voice/bylines.ts`). Not "Columns": a paper's inside page has a name,
    // and this one already had it.
    // `wire` is a column — trends in the waiver market, argued — so it lives
    // with the opinion even though it files under its own edition name. The
    // page's name is an homage and the ARTICLE carries its own masthead: the
    // Bin prints "The Mercato Wire" in its byline while sitting on this page.
    kinds: ["eleven", "power-ranking", "dodgers", "predictions", "wire"],
  },
];

/** The page at a route, or a thrown error naming the route.
 *
 *  The two section pages looked themselves up with a non-null assertion, which
 *  turns a renamed href into `undefined.label` at render — a stack trace about
 *  a property, three frames from the table that actually disagreed. This says
 *  which route is missing, at build, in one line. */
export function pageAt(href: string): PaperPage {
  const page = PAPER_PAGES.find((each) => each.href === href);
  if (page === undefined) throw new Error(`No paper page declares ${href}.`);
  return page;
}

/** The page a story belongs on, for a teaser that says where to turn. Null when
 *  no page claims the kind, which is ordinary: a column with no page of its own
 *  is read on the front page and nowhere else. */
export function pageOf(kind: string): PaperPage | null {
  return PAPER_PAGES.find((page) => page.kinds?.includes(kind)) ?? null;
}

/** One story's own page. */
export function storyHref(slug: string): string {
  return `/paper/${slug}`;
}
