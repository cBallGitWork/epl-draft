import { LEAGUE_NAME } from "@epl/core";
import ButtonLink from "../components/shell/ButtonLink";
import LeagueCrest from "../components/shell/LeagueCrest";
import Skeleton from "../components/shell/Skeleton";
import SkeletonRows from "../components/shell/SkeletonRows";
import { GAMEWEEK_HEAD, GAMEWEEK_TITLE } from "@/app/desk";
import { SQUAD } from "../squad/routes";

// The live centre before either provider answers. The card copies `MatchupWaiting`: two occurrences (CODE_RULES §1).

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <section className="cm-panel flex flex-col gap-2 p-3">
        <Skeleton width="9rem" height="0.75rem" />
        <Skeleton width="100%" height="2.75rem" />
        <Skeleton width="60%" height="0.75rem" />
      </section>

      <header className={GAMEWEEK_HEAD}>
        <div className="flex items-center gap-2.5">
          <LeagueCrest height={26} />
          <div className="flex flex-col gap-1.5">
            <h1 className={GAMEWEEK_TITLE}>{LEAGUE_NAME}</h1>
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

      <ButtonLink href={SQUAD}>Squads</ButtonLink>
    </div>
  );
}
