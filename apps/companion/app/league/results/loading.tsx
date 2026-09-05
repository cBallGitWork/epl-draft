import LeagueShell from "../Shell";
import SkeletonRows from "../../components/shell/SkeletonRows";

// The season's played rounds, waiting on Fantrax.
//
// Row-height blocks, unlike the matchups board's: a result is one scoreline and
// not a scoreline over a labelled line, so the list it settles into is the
// table's height rather than half again.

export default function Loading() {
  return (
    <LeagueShell current="results">
      <div aria-busy>
        <SkeletonRows count={6} height="2.75rem" />
      </div>
    </LeagueShell>
  );
}
