import ButtonLink from "./components/shell/ButtonLink";
import LeagueCrest from "./components/shell/LeagueCrest";
import { SMALL_CAPS } from "./desk";

// A 404 on the desk, set on the desk.
//
// **The paper had one and the desk did not**, which is not a small asymmetry:
// `(paper)/not-found.tsx` is scoped to its route group, so every refusal outside
// it — a club code that is not a number, a gameweek past 38, a team id nobody
// holds, a URL nobody ever served — fell through to Next's own default. That
// page is 404 in Vercel's system font beside a hairline rule, and it was being
// drawn over our stadium photograph, inside our rail, between the section
// plates. DESIGN §1 gives this app two registers; that was a third, and the one
// a reader meets on the day something is wrong.
//
// It is `error.tsx`'s shape and not a new one, because the two are the same
// promise in different words — the section is still there, and here is the way
// back. The crest rather than the photograph does the work `Nothing` gives it:
// this is our page saying no, not the app having fallen over.
//
// **On a `.cm-panel`, and that is not decoration.** `PhotoGround`'s rule is that
// nothing prints text on the bare ground — `tools/ui/groundfit.mjs` measures it
// on every desk route, because a photograph has no contrast floor and CM never
// takes the risk. The first cut of this file set a headline, a paragraph and a
// crest straight onto the stadium and would have been the one page in the app
// breaking the rule the page underneath it exists to keep.
//
// **Not the status code.** These routes answer 200, because Next streams the
// shell before the page throws — see PLATFORM_NOTES. What a reader sees is this
// file's business and what a crawler sees is settled by the `noindex` Next
// injects; both are handled, and neither is the status line.

export default function NotFound() {
  return (
    <div className="cm-panel flex flex-col items-center gap-4 p-6 py-10 text-center">
      <LeagueCrest variant="full" height={104} />
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Nothing at that address
        </h1>
        <p className="mx-auto max-w-xs text-sm text-muted">
          No club, player, round or team goes by that name here. Everything the app does have is
          one tap away on the left.
        </p>
        {/* Named rather than merely absent, on `Nothing`'s precedent: a reader
            who followed a link that used to work is owed the difference between
            "this is gone" and "this never was". */}
        <p className={`${SMALL_CAPS} pt-1 text-faint`}>404</p>
      </div>
      <ButtonLink href="/">The front page</ButtonLink>
    </div>
  );
}
