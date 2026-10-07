import { LEAGUE_COMPETITION } from "@epl/core";
import LeagueShell from "../Shell";
import Section from "../../components/shell/Section";
import Skeleton from "../../components/shell/Skeleton";
import SkeletonRows from "../../components/shell/SkeletonRows";

// The season, waiting on the league's description of itself.

export default function Loading() {
  return (
    <LeagueShell current="schedule">
      <div aria-busy className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5 px-3">
          <Skeleton width="100%" height="2.75rem" />
          <Skeleton width="48%" height="2.75rem" />
          <Skeleton width="48%" height="2.75rem" />
        </div>

        <div className="flex items-center justify-between gap-3 px-3">
          <Skeleton width="9rem" height="0.75rem" />
          <Skeleton width="4rem" height="0.75rem" />
        </div>

        {/* The one competition every gameweek has; most weeks have no cup. */}
        <Section title={LEAGUE_COMPETITION.name}>
          <SkeletonRows count={4} height="3.5rem" />
        </Section>
      </div>
    </LeagueShell>
  );
}
