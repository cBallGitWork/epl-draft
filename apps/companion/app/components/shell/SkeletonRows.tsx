import Skeleton from "./Skeleton";

// A list of empty rows at the real rows' height, so the real ones land without pushing the page down.
// `count` is a frame hint, never the league's team or pairing count, which come from `getLeagueInfo`.

export default function SkeletonRows({ count, height }: { count: number; height: string }) {
  return (
    <ul aria-busy className="cm-rows flex flex-col">
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
