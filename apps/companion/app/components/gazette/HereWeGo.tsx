import { type Club, type StoryFace, type StoryTransfer, inkOn, isGoalkeeper } from "@epl/core";
import PlayerImage from "../league/PlayerImage";
import { teamColours } from "@/app/teamColours";

// Here We Go's picture: the man cut out on the side he joined, its name large and faint behind him, the house insider's
// credit in the corner and "HERE WE GO!" across his feet. Printed through the ink like every face (`.paper-face`).

type Rank = "splash" | "card" | "portrait";

/** The front page's frame, or the article's upright card. */
const FRAME: Record<Rank, string> = { splash: "paper-frame bleed", card: "paper-frame", portrait: "aspect-[4/5]" };

/** How much of the frame he stands in: off its height in a frame, past its width in the upright card, as the cut-out is wide. */
const MAN: Record<Rank, string> = { splash: "h-[90%] aspect-[1.32]", card: "h-[90%] aspect-[1.32]", portrait: "w-[125%]" };

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
  // The side's name fills the width whatever its length: Bru as large as Glengarry allows.
  const nameSize = `${Math.min(34, 150 / Math.max(transfer.team.length, 1))}cqw`;

  return (
    <div
      className={`paper-face @container relative flex items-end justify-center overflow-hidden ${FRAME[rank]}`}
      style={{ background: `radial-gradient(ellipse at 50% 35%, ${colours.secondary} -40%, ${colours.primary} 70%)`, color: ink }}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-[18%] text-center font-display font-bold uppercase leading-none opacity-20"
        style={{ fontSize: nameSize }}
      >
        {transfer.team}
      </span>
      {/* The corner credit where there is room for it; on a card it would sit on the side's name. */}
      {rank === "card" ? null : (
        <span
          aria-hidden
          className="absolute left-[3%] top-[3%] max-w-[30%] font-display text-[3.5cqw] font-bold uppercase italic leading-[0.95]"
        >
          {credit}
        </span>
      )}
      <div className={`relative ${MAN[rank]} shrink-0`}>
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
        className="absolute inset-x-0 bottom-[3%] text-center font-display font-bold uppercase italic leading-none tracking-tight [text-shadow:0_0.4cqw_1.2cqw_rgb(0_0_0/0.45)]"
        style={{ fontSize: rank === "portrait" ? "17cqw" : "13cqw" }}
      >
        Here we go!
      </span>
    </div>
  );
}
