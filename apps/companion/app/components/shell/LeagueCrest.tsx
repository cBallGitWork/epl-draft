import { LEAGUE_NAME, SEASON } from "@epl/core";

// The league's own crest: the shapes nod to Tim Hortons, but nothing here reproduces their mark.
// The leaf is the Canadian flag's, a public-domain symbol, normalised into a 100x100 box.
// `mark` carries no type, so it survives an unloaded font down to about 24px; `full` adds the name.

export const LEAF =
  "m2490 4430-45-863a95 95 0 0 1 111-98l859 151-116-320a65 65 0 0 1 20-73l941-762-212-99a65 65 0 " +
  "0 1-34-79l186-572-542 115a65 65 0 0 1-73-38l-105-247-423 454a65 65 0 0 1-111-57l204-1052-327 " +
  "189a65 65 0 0 1-91-27l-332-652-332 652a65 65 0 0 1-91 27l-327-189 204 1052a65 65 0 0 1-111 " +
  "57l-423-454-105 247a65 65 0 0 1-73 38l-542-115 186 572a65 65 0 0 1-34 79l-212 99 941 762a65 " +
  "65 0 0 1 20 73l-116 320 859-151a95 95 0 0 1 111 98l-45 863z";

/** "26/27", as the league writes it on a crest. */
const shortSeason = SEASON.slice(2);

function Leaf({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 100 100" overflow="visible">
      <path fill="currentColor" transform="translate(-0.02,-0.34) scale(0.0208437)" d={LEAF} />
    </svg>
  );
}

export default function LeagueCrest({
  variant = "mark",
  height = 22,
}: {
  variant?: "mark" | "full";
  height?: number;
}) {
  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 64 44"
        height={height}
        width={(height * 64) / 44}
        role="img"
        aria-label={LEAGUE_NAME}
        className="crest shrink-0"
      >
        <ellipse cx="32" cy="22" rx="31.5" ry="21.5" className="fill-league" />
        <ellipse cx="32" cy="22" rx="28" ry="18" fill="none" strokeWidth="2" className="stroke-cream" />
        <g className="text-cream">
          <Leaf x={16} y={4} size={32} />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 232 160"
      height={height}
      width={(height * 232) / 160}
      role="img"
      aria-label={LEAGUE_NAME}
      className="crest shrink-0"
    >
      <ellipse cx="116" cy="80" rx="115" ry="79" className="fill-league" />
      <ellipse cx="116" cy="80" rx="108.5" ry="72.5" fill="none" strokeWidth="3.5" className="stroke-cream" />
      <ellipse
        cx="116" cy="80" rx="102" ry="66" fill="none" strokeWidth="1" opacity="0.55"
        className="stroke-cream"
      />
      <path id="crest-arc" d="M 34 84 A 82 56 0 0 1 198 84" fill="none" />
      <text
        fontFamily="var(--font-display)" fontWeight="700" fontSize="19" letterSpacing="3.2"
        className="fill-cream"
      >
        <textPath href="#crest-arc" startOffset="50%" textAnchor="middle">
          TIM HORTONS
        </textPath>
      </text>
      <g className="text-cream">
        <Leaf x={74} y={28} size={84} />
      </g>
      <rect x="52" y="112" width="128" height="21" rx="3" className="fill-cream" />
      <text
        x="116" y="127.5" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700"
        fontSize="15" letterSpacing="2.6" className="fill-league"
      >
        PRO LEAGUE
      </text>
      <text
        x="116" y="147" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700"
        fontSize="11" letterSpacing="2" opacity="0.8" className="fill-cream"
      >
        {shortSeason}
      </text>
    </svg>
  );
}
