import LeagueShell from "../Shell";
import SkeletonRows from "../../components/shell/SkeletonRows";

// The pairings waiting on Fantrax's scoreboard: a card is a scoreline over a labelled line.

export default function Loading() {
  return (
    <LeagueShell current="matchups">
      <SkeletonRows count={4} height="4.5rem" />
    </LeagueShell>
  );
}
