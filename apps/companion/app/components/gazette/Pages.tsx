import TurnLink from "./TurnLink";
import { PAPER_PAGES } from "./paperPages";

// The paper's own strip: which page of the Gazetta you are on.
//
// **Not the same list as `Index`, deliberately.** That strip carries the app's
// six sections and is why the front page is not a dead end; this one carries
// the paper's pages and nothing else. Printing the desk's section names twice
// over in newsprint is precisely what got inside pages reverted on 31 Aug, so
// the two strips are different content in different dress: the index is ranged
// across the full measure in muted small capitals, and this is a row of ink
// chips, the same inverted block a kicker and a byline already wear.
//
// A server component told where it is, like `Index` — no `usePathname`, no
// client bundle.

export default function Pages({
  here,
}: {
  /** The route this strip is printed on, and therefore the page it marks. */
  here: string;
}) {
  return (
    <nav
      aria-label="Pages"
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-sans text-3xs font-semibold uppercase tracking-[0.16em]"
    >
      {PAPER_PAGES.map((page) => {
        const current = page.href === here;
        return (
          <TurnLink
            key={page.href}
            href={page.href}
            aria-current={current ? "page" : undefined}
            // Inverted ink for the page you are on, and the stock for the rest.
            // Ink-on-stock and stock-on-ink are the sheet's two colours doing
            // the work a highlight would do on a screen; the red is spent on
            // the index's "where you are" and is not spent twice.
            className={`flex min-h-11 items-center px-2 ${
              current ? "bg-ink text-bg" : "text-muted"
            }`}
          >
            {/* The number is quieter than its label in both states, but the
                quiet is made of different stuff: `text-faint` is ink at an
                opacity and only reads on the stock, so on the ink chip it is
                the stock at an opacity instead. */}
            <span className={current ? "text-bg/60" : "text-faint"}>{page.number}</span>
            <span className="pl-1.5">{page.label}</span>
          </TurnLink>
        );
      })}
    </nav>
  );
}
