import { readerTeamId } from "../../../squads";
import { edition } from "../../../edition";
import Folio from "../../../components/gazette/Folio";
import { named } from "../../../components/gazette/named";
import Pages from "../../../components/gazette/Pages";
import Teaser from "../../../components/gazette/Teaser";
import Written from "../../../components/gazette/Written";
import Extras from "../../../components/gazette/Extras";
import { pageAt } from "../../../components/gazette/paperPages";

// Page 2: the match-shaped columns.
//
// One article printed whole, the rest as headlines behind it. That was the front
// page's grammar too until 3 Sep 2026, when the front page dropped to headlines
// alone — and an INSIDE page keeps it, because an inside page is where an
// article goes and a reader who turned to page 2 has already chosen to read.
// What differs from page 3 is the shelf: this page prints only the kinds that
// are about football that has been played or is about to be.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically,
// so it cannot be imported.
export const revalidate = 30;

const PAGE = pageAt("/paper/reports");

export default async function ReportsPage() {
  const mine = await readerTeamId();
  const paper = await edition(mine);
  const who = named(paper.teams);

  const stories = paper.filed.filter((story) => PAGE.kinds?.includes(story.kind));
  const [lead, ...rest] = stories;

  return (
    <>
      <Folio section={PAGE.label} number={PAGE.number} at={paper.snapshot?.fetchedAt ?? null} />
      <Pages here={PAGE.href} />

      {lead === undefined ? (
        // **A section says why it is empty; a front-page section just vanishes.**
        // Someone navigated here on purpose, so silence would read as breakage.
        // One line of ink and not a `Nothing` panel: the crest panel is for the
        // whole paper having nothing, and this is one page of a paper that does.
        <p className="pt-6 text-lg italic leading-snug text-muted">
          Nothing has been filed under this head yet. The front page carries the week.
        </p>
      ) : (
        <div className="flex flex-col gap-5 pt-4">
          <section className="flex flex-col">
            <Written story={lead} teams={paper.teams} />
            <Extras story={lead} named={who} mine={paper.mine} />
          </section>
          {rest.map((story) => (
            <Teaser key={story.slug} story={story} />
          ))}
        </div>
      )}
    </>
  );
}
