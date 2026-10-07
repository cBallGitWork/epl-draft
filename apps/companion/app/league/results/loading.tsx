import LeagueShell from "../Shell";
import SkeletonRows from "../../components/shell/SkeletonRows";

// The played rounds waiting on Fantrax: one scoreline a row.

export default function Loading() {
  return (
    <LeagueShell current="results">
      <SkeletonRows count={6} height="2.75rem" />
    </LeagueShell>
  );
}
