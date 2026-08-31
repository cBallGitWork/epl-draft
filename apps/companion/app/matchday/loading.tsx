import Link from "next/link";
import { LEAGUE_NAME } from "@epl/core";
import ButtonLink from "../components/shell/ButtonLink";
import LeagueCrest from "../components/shell/LeagueCrest";
import Skeleton from "../components/shell/Skeleton";
import SkeletonRows from "../components/shell/SkeletonRows";

// The live centre, before either provider has answered.
//
// The head-to-head card is drawn and "your afternoon" is not, and the difference
// is how often each is on the page: every signed-in manager has a pairing during
// a round, while the afternoon panel only exists when he still has players to
// come, which is a minority of the week. A block that vanishes is worse than one
// that was never drawn.
//
// The same card is `YourMatchup`'s Suspense fallback in `page.tsx`. Copied
// rather than shared: two occurrences (CODE_RULES §1), and they answer different
// questions — this one is the whole page waiting, that one is the head-to-head
// waiting under football that has already landed.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <div className="flex justify-end pt-1">
        <Link
          href="/matchday/desk"
          className="text-2xs font-bold uppercase text-faint hover:text-muted"
        >
          The desk →
        </Link>
      </div>

      <section className="cm-panel flex flex-col gap-2 p-3">
        <Skeleton width="9rem" height="0.75rem" />
        <Skeleton width="100%" height="2.75rem" />
        <Skeleton width="60%" height="0.75rem" />
      </section>

      <header className="flex items-baseline justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <LeagueCrest height={26} />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-bold tracking-tight">{LEAGUE_NAME}</h1>
            <Skeleton width="6.5rem" height="0.875rem" />
          </div>
        </div>
      </header>

      {/* Ten: the football layer's rules are fixed, and twenty clubs make ten
          fixtures. */}
      <SkeletonRows count={10} height="3.5rem" />

      <nav className="flex items-center justify-between gap-3">
        <Skeleton width="48%" height="2.75rem" />
        <Skeleton width="48%" height="2.75rem" />
      </nav>

      <ButtonLink href="/squad">Squads</ButtonLink>
    </div>
  );
}
