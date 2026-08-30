import Skeleton from "./Skeleton";

// The app's standard list of cards, before there is anything to put in them.
//
// Five screens open on this same shape — the table, the squad list, the matchup
// cards and both fixture lists — so it is drawn once and each of them says how
// tall a row is and how many to expect. The height is the point: the real rows
// land inside these boxes instead of pushing them down the screen, which is the
// whole reason a loading state is worth drawing rather than spinning.
//
// **`count` is a frame hint and never a fact about the league.** How many teams
// are in it and how many pairings a period has are read from `getLeagueInfo`
// (CLAUDE.md), so a skeleton that wrote either number down would be asserting
// one of the few things this app has promised never to assume.

export default function SkeletonRows({ count, height }: { count: number; height: string }) {
  return (
    <ul className="cm-rows flex flex-col">
      {Array.from({ length: count }, (_, at) => (
        <li
          key={at}
          className="flex items-center px-3"
          style={{ height }}
        >
          <Skeleton width="45%" height="0.875rem" />
        </li>
      ))}
    </ul>
  );
}
