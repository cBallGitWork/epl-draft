import LeagueShell from "../Shell";
import SkeletonRows from "../../components/shell/SkeletonRows";

// One row a team, the table's own height: this is the table's shape with
// different columns on it, not a different kind of list.

export default function Loading() {
  return (
    <LeagueShell title="Team Stats" current="teamStats">
      <div aria-busy>
        <SkeletonRows count={6} height="2.75rem" />
      </div>
    </LeagueShell>
  );
}
