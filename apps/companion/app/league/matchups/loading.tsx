import LeagueShell from "../Shell";
import SkeletonRows from "../../components/shell/SkeletonRows";

// The week's pairings, waiting on Fantrax's scoreboard.
//
// Taller rows than the table's: a pairing card is a scoreline over a labelled
// line, which is two rows of the list's height rather than one.

export default function Loading() {
  return (
    <LeagueShell title="Matchups" current="matchups">
      <div aria-busy>
        <SkeletonRows count={4} height="4.5rem" />
      </div>
    </LeagueShell>
  );
}
