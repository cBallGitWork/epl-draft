import LeagueShell from "../Shell";
import Skeleton from "../../components/shell/Skeleton";
import SkeletonRows from "../../components/shell/SkeletonRows";

export default function Loading() {
  return (
    <LeagueShell current="cups">
      <div aria-busy className="flex flex-col gap-3">
        <div className="flex gap-1.5 px-3">
          <Skeleton width="8rem" height="2.75rem" />
          <Skeleton width="10rem" height="2.75rem" />
        </div>
        <SkeletonRows count={4} height="2.75rem" />
      </div>
    </LeagueShell>
  );
}
