import { LEAGUE_NAME } from "@epl/core";
import BackPlate from "../../components/shell/BackPlate";
import ButtonLink from "../../components/shell/ButtonLink";
import LeagueCrest from "../../components/shell/LeagueCrest";
import Skeleton from "../../components/shell/Skeleton";
import SkeletonRows from "../../components/shell/SkeletonRows";
import { LIVE } from "../../components/shell/sections";
import { GAMEWEEK_HEAD, GAMEWEEK_TITLE } from "@/app/desk";
import { SQUAD } from "../../squad/routes";

// A round before FPL answers, in `GameweekView`'s frame; the crest, name and Squads link need no provider.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <header className={GAMEWEEK_HEAD}>
        <div className="flex items-stretch gap-2.5">
          <BackPlate fallback={LIVE} />
          <div className="flex items-center gap-2.5">
            <span className="flex max-lg:hidden">
              <LeagueCrest height={26} />
            </span>
            <div className="flex flex-col gap-1.5">
              <h1 className={GAMEWEEK_TITLE}>{LEAGUE_NAME}</h1>
              <Skeleton width="6.5rem" height="0.875rem" />
            </div>
          </div>
        </div>
      </header>

      {/* Ten: twenty clubs make ten fixtures, a football rule rather than a league setting. */}
      <SkeletonRows count={10} height="3.5rem" />

      {/* The previous/next pair at its own height, so the button under it does
          not jump up the screen when the round names its neighbours. */}
      <nav className="flex items-center justify-between gap-3">
        <Skeleton width="48%" height="2.75rem" />
        <Skeleton width="48%" height="2.75rem" />
      </nav>

      <ButtonLink href={SQUAD}>Squads</ButtonLink>
    </div>
  );
}
