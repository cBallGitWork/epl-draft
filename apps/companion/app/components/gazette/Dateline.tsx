import { PAPER_CORRESPONDENT, type PublishedStory } from "@epl/core";
import { londonDayAndTime } from "../../londonTime";
import { pageOf } from "./paperPages";

// Which edition filed a story, when, and where the rest of it is.
//
// Three occurrences counted on 16 Sep 2026 — `Splash`, `Teaser` and `Written` —
// which is the rule-of-2/3 bar met exactly rather than felt. All three set the
// same letterspaced small capitals, opened with the same `{edition} · ` prefix
// and printed the same `Filed {time}`; two of them followed it with the same
// turn-line. What varied was the wrapper element and nothing else.
//
// **The splash is credited and the ranks below it are not**, which is measured
// rather than felt: with the byline on, every dateline ran to THREE lines of
// small capitals at 390 — 36px of furniture under a teaser whose deck is two
// lines, so the credit outweighed the story it belonged to. A front page
// credits its splash and lets its seconds carry the filing alone; the article
// page is credited too, being the piece itself.
//
// **The reporter's name leads it, because that is a byline and the ink chip
// above is not.** `story.byline` renders as an inverted standing head — THE
// BACK PAGE, THE SELECTOR — which is a column's title and not a person. A paper
// runs both: the standing head over the piece, "by <name>" under it with the
// filing. The name is a constant rather than a field on the story; `config.ts`
// in core carries why, and the short version is that one correspondent is a
// fact about the paper and two would be a fact about a story.
//
// **The turn-line is optional and that is a real distinction, not a flag for
// its own sake.** `Written` IS the article, so a line reading "turn to page 2"
// there would point the reader at the page he is already on. The two front-page
// ranks are teasers and do carry it.
//
// **The element is the caller's, because the two ranks nest differently.** A
// splash's dateline is a block under an ornament rule and a teaser's is the last
// line inside a `TurnLink`, so a `<p>` inside a `<span>` would be invalid markup
// the browser resolves by unnesting it. `as` takes the tag rather than a variant
// name: there are exactly two and the caller already knows which it is.
//
// Deliberately NOT extracted with it: the class string itself. It reads
// `font-sans text-3xs uppercase tracking-[0.16em]` at sixteen sites across the
// paper, but in three weights — 8 `font-semibold`, 6 bare, 2 `font-bold` — and
// the weights are not noise: bare is a dateline, bold is a standing head. A
// single constant would be followed by eight sites and overridden by eight,
// which is the DASH failure CODE_RULES §4 names. The dateline is extracted here
// as a COMPONENT because it is one meaning; the class string stays duplicated
// until the roles it serves are separated.

export default function Dateline({
  story,
  as = "p",
  turn = true,
  byline = true,
  className = "",
}: {
  story: PublishedStory;
  /** `p` for a splash's own block, `span` inside a teaser's link. */
  as?: "p" | "span";
  /** Whether to point at the rest of the story. False on the article itself. */
  turn?: boolean;
  /** Whether to credit the correspondent. False on the ranks below the splash. */
  byline?: boolean;
  className?: string;
}) {
  const Tag = as;
  const page = pageOf(story.kind);
  // A story always has an edition or a filing instant or neither; `Written`
  // renders nothing at all when there is no `filedAt`, and that stays true here.
  if (story.filedAt === "") return null;

  return (
    <Tag className={`font-sans text-3xs uppercase tracking-[0.16em] text-faint${className === "" ? "" : ` ${className}`}`}>
      {byline ? `by ${PAPER_CORRESPONDENT} · ` : ""}
      {story.edition !== "" ? `${story.edition} · ` : ""}
      Filed {londonDayAndTime(story.filedAt)}
      {/* The affordance, in words rather than a chevron, and literally true: a
          paper says "turn to page four" and this one can. A kind with no page of
          its own still has an article behind it, so it says so without naming a
          page it does not have. */}
      {turn ? (
        <span className="text-muted">
          {page === null ? " · read on" : ` · turn to page ${page.number}`}
        </span>
      ) : null}
    </Tag>
  );
}
