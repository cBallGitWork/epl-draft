import { PAPER_CORRESPONDENT, type PublishedStory, londonDayAndTime } from "@epl/core";
import { pageOf } from "./paperPages";

// Which edition filed a story, when, and where the rest of it is: "by <name>" (a person, never the standing head),
// the edition, the filing time, and a turn-line unless the reader is already on that page (`turn`, `here`). The
// small-caps class stays written out: sixteen sites in three weights that mean three different things.

export default function Dateline({
  story,
  as = "p",
  turn = true,
  byline,
  here,
  className = "",
}: {
  story: PublishedStory;
  /** `p` for a splash's own block, `span` inside a teaser's link. */
  as?: "p" | "span";
  /** Whether to point at the rest of the story. False on the article itself. */
  turn?: boolean;
  /** Whether to credit the house correspondent. False on the front's ranks and over a columnist's own byline. */
  byline: boolean;
  /** The page the reader is ON, when it is a section page. A teaser sitting on
   *  the page it points at said "turn to page 2" to somebody already reading
   *  page 2 — true of every teaser on both section pages. */
  here?: string;
  className?: string;
}) {
  const Tag = as;
  const page = pageOf(story.kind);
  // A story always has an edition or a filing instant or neither; `Written`
  // renders nothing at all when there is no `filedAt`, and that stays true here.
  if (story.filedAt === "") return null;

  return (
    <Tag className={`font-sans text-3xs uppercase tracking-[0.16em] text-faint${className === "" ? "" : ` ${className}`}`}>
      {/* A column the desk printed from facts has no correspondent to credit. */}
      {byline && story.kind !== "predicted-xi" ? `by ${credit(story)} · ` : ""}
      {story.edition !== "" ? `${story.edition} · ` : ""}
      Filed {londonDayAndTime(story.filedAt)}
      {/* The affordance, in words rather than a chevron, and literally true: a
          paper says "turn to page four" and this one can. A kind with no page of
          its own still has an article behind it, so it says so without naming a
          page it does not have. */}
      {turn ? (
        <span className="text-muted">
          {page === null || page.href === here ? " · read on" : ` · turn to page ${page.number}`}
        </span>
      ) : null}
    </Tag>
  );
}


/** Whose name leads the byline: the reporter's, or the house correspondent's. */
function credit(story: PublishedStory): string {
  return story.reporter ?? PAPER_CORRESPONDENT;
}
