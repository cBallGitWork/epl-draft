import { type Club, type StoryFace, type StoryTransfer, inkOn, isGoalkeeper } from "@epl/core";
import PlayerImage from "../league/PlayerImage";
import { teamColours } from "@/app/teamColours";

// Here We Go's picture: the man cut out on the side he joined, its name large above his head, the house insider's credit
// in the corner and "HERE WE GO!" across his feet. Printed through the ink like every face (`.paper-face`).

type Rank = "splash" | "card" | "portrait";

/** The front page's frame, or the article's upright card. */
const FRAME: Record<Rank, string> = { splash: "paper-frame bleed", card: "paper-frame", portrait: "aspect-[4/5]" };

/** The cut-out's width over its height. */
const CUT_OUT = 1.32;

export default function HereWeGo({
  face,
  transfer,
  credit,
  clubs,
  rank,
}: {
  face: StoryFace;
  transfer: StoryTransfer;
  /** The house insider's name, from the staff table. */
  credit: string;
  clubs: Map<number, Club>;
  rank: Rank;
}) {
  const colours = teamColours(transfer.teamId);
  const ink = inkOn(colours);
  // The side's name fills the width whatever its length, Bru as large as Glengarry allows; he stands in what it leaves.
  const nameSize = Math.min(rank === "card" ? 20 : 26, 150 / Math.max(transfer.team.length, 1));
  const nameTop = rank === "card" ? 3 : 9;

  return (
    <div
      className={`paper-face @container relative flex items-end justify-center overflow-hidden ${FRAME[rank]}`}
      style={{ background: `radial-gradient(ellipse at 50% 35%, ${colours.secondary} -40%, ${colours.primary} 70%)`, color: ink }}
    >
      {/* The corner credit where there is room for it; on a card it would crowd the side's name. */}
      {rank === "card" ? null : (
        <span
          aria-hidden
          className="absolute left-[3%] top-[3%] max-w-[30%] font-display text-[3.5cqw] font-bold uppercase italic leading-[0.95]"
        >
          {credit}
        </span>
      )}
      <div className="relative shrink-0" style={{ height: `calc(100% - ${nameTop + nameSize * 0.8}cqw)`, aspectRatio: CUT_OUT }}>
        <PlayerImage
          player={{ code: face.code, name: face.name }}
          club={clubs.get(face.clubId)}
          keeper={isGoalkeeper(face.position)}
          kickedOff
          large={rank !== "card"}
          sizes={rank === "card" ? "224px" : "352px"}
        />
      </div>
      <span
        aria-hidden
        className="absolute inset-x-0 text-center font-display font-bold uppercase leading-[0.8]"
        style={{ top: `${nameTop}cqw`, fontSize: `${nameSize}cqw` }}
      >
        {transfer.team}
      </span>
      <span
        className="absolute inset-x-0 bottom-[3%] text-center font-display font-bold uppercase italic leading-none tracking-tight [text-shadow:0_0.4cqw_1.2cqw_rgb(0_0_0/0.45)]"
        style={{ fontSize: rank === "portrait" ? "17cqw" : "13cqw" }}
      >
        Here we go!
      </span>
    </div>
  );
}
