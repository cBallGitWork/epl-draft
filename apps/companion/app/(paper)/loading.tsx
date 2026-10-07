import Column from "../components/gazette/Column";
import Masthead from "../components/gazette/Masthead";
import Skeleton from "../components/shell/Skeleton";

// The front page before the news is in: the real masthead (it reads nothing from Fantrax) over blocks for the stories.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-5">
      {/* No dateline, no number and no notice yet: each is a claim about an
          edition that has not arrived. The masthead answers null with the
          paper's own name, which is the one thing true before it loads. */}
      <Masthead at={null} />

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
