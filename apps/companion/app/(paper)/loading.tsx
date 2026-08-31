import { LEAGUE_NAME } from "@epl/core";
import Column from "../components/gazette/Column";
import Masthead from "../components/gazette/Masthead";
import Skeleton from "../components/shell/Skeleton";

// The front page, printed before the news has come in.
//
// The masthead is the real one: nothing on it is read from Fantrax, so the paper
// carries its own name, its rule and its standing line from the first paint and
// only the stories are waiting. The wrapper — and with it the `.paper`
// register and the serifs — is the group layout's, so the edition lands into
// these blocks rather than re-colouring the screen under the reader.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-5">
      {/* No dateline yet — it is a claim about when the edition was assembled, and
          the masthead already answers null with the paper's own name. */}
      <Masthead at={null} line={`${LEAGUE_NAME}, week by week.`} />

      {/* The lead: the picture band at its printed height, then the kicker, the
          headline over two lines and the standfirst under it. */}
      <section className="flex flex-col gap-2.5">
        <div className="bleed">
          <Skeleton width="100%" height="8.5rem" />
        </div>
        <Skeleton width="7rem" height="0.75rem" />
        <Skeleton width="100%" height="1.75rem" />
        <Skeleton width="70%" height="1.75rem" />
        <Skeleton width="90%" height="0.875rem" />
      </section>

      <Column title="Also this week">
        <div className="flex flex-col gap-2 py-2">
          <Skeleton width="85%" height="0.875rem" />
          <Skeleton width="65%" height="0.875rem" />
        </div>
      </Column>
    </div>
  );
}
