import BackPlate from "../../../components/shell/BackPlate";
import Skeleton from "../../../components/shell/Skeleton";
import PhotoGround from "../../../components/football/PhotoGround";
import { MATCHUP_VIEWS } from "./views";
import { MATCHUPS } from "../../routes";

// One head-to-head waiting on both elevens, in the board's shapes: the scoreline, a plate per view, the grass. No
// `LeagueShell`, because the page has none.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-2">
      {/* The desk's ground until the home team's arrives: this route draws its own. */}
      <PhotoGround subject={null} />
      <div className="flex items-stretch gap-px">
        <BackPlate fallback={MATCHUPS} />
        <Skeleton width="50%" height="4rem" />
        <Skeleton width="50%" height="4rem" />
      </div>

      {/* The real plate, so its height is `.cm-tab`'s at both widths. */}
      <div className="flex gap-px">
        {MATCHUP_VIEWS.map((view) => (
          <span key={view} aria-hidden className="cm-tab flex-1 animate-pulse bg-current/15" />
        ))}
      </div>

      <div className="bleed">
        <Skeleton width="100%" height="26rem" />
      </div>
    </div>
  );
}
