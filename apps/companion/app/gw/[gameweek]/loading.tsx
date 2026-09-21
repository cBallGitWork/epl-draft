import { LEAGUE_NAME } from "@epl/core";
import ButtonLink from "../../components/shell/ButtonLink";
import LeagueCrest from "../../components/shell/LeagueCrest";
import Skeleton from "../../components/shell/Skeleton";
import SkeletonRows from "../../components/shell/SkeletonRows";
import { GAMEWEEK_HEAD, GAMEWEEK_TITLE } from "@/app/desk";
import { SQUAD } from "../../squad/routes";

// A round of football before FPL has answered — `GameweekView`'s own frame.
//
// The crest and the league's name are ours and need nobody, so they paint at
// once; the round number and the fixtures are all that is waiting. The way out
// to the squads is a real link from the first frame, because a reader who
// arrived here by mistake should not have to wait for a round to leave it.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <header className={GAMEWEEK_HEAD}>
        <div className="flex items-center gap-2.5">
          <LeagueCrest height={26} />
          <div className="flex flex-col gap-1.5">
            <h1 className={GAMEWEEK_TITLE}>{LEAGUE_NAME}</h1>
            <Skeleton width="6.5rem" height="0.875rem" />
          </div>
        </div>
      </header>

      {/* Ten. Unlike a team count this is the football layer, whose rules are
          fixed for everyone: twenty clubs make ten fixtures, and a blank or a
          double moves it by one or two rather than by a league setting. */}
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
