import Image from "next/image";
import { type Club, type StoryFace, clubColoursOf, crestUrl, isGoalkeeper } from "@epl/core";
import PlayerImage from "../league/PlayerImage";

// The man a story is about, cut out on his club's colours with the crest behind him, printed
// through the ink (`.paper-face`). Chosen by the desk (`assemble.faceOf`), never by the writer.
// On the front page he stands in a `.paper-frame`, sized off its height, so no width can stretch it.

type Rank = "splash" | "card" | "portrait" | "tie";

/** The front page's ranks, which print in the fixed frame; the other two are an article's. */
const FRAMED: Record<Rank, boolean> = { splash: true, card: true, portrait: false, tie: false };

const BAND: Record<Rank, string> = {
  splash: "paper-frame bleed",
  card: "paper-frame",
  // Beside a standfirst, the one rank with no fixed height: the frame takes his own, so the whole portrait prints.
  portrait: "h-auto",
  // Beside a tie in Lawro's column: a square his prose wraps round (Craig: "thumbnails can be bigger").
  tie: "h-24 w-24 shrink-0 rounded-none",
};

/** How much of the band he stands in. In a frame, a share of its height, so his head stays in it. */
const MAN: Record<Rank, string> = {
  splash: "h-[92%] aspect-[1.32]",
  card: "h-[92%] aspect-[1.32]",
  portrait: "w-full",
  tie: "w-[5.5rem] pt-2",
};

/** The crest watermark's pixel size, half out of frame; a tie has no room for one. */
const CREST: Record<Rank, number | null> = {
  splash: 208,
  card: 128,
  portrait: 150,
  tie: null,
};

export default function Face({
  face,
  clubs,
  rank,
}: {
  face: StoryFace;
  /** The round's clubs, keyed by FPL id. Empty costs the picture its kit and
   *  its crest, never the story. */
  clubs: Map<number, Club>;
  rank: Rank;
}) {
  const club = clubs.get(face.clubId);
  const colours = clubColoursOf(club);
  const crest = CREST[rank];
  const framed = FRAMED[rank];

  return (
    <div
      className={`paper-face flex justify-center overflow-hidden ${rank === "portrait" ? "items-stretch" : "items-end"} ${BAND[rank]}`}
      style={{
        background: `linear-gradient(150deg, ${colours.primary} 0%, ${colours.secondary} 100%)`,
      }}
    >
      {club && crest !== null ? (
        <Image
          src={crestUrl(club)}
          alt=""
          width={crest}
          height={crest}
          // In a frame the crest is sized off the frame's height, as he is.
          className={
            framed
              ? "absolute -right-[12%] top-1/2 h-[120%] w-auto -translate-y-1/2 opacity-15"
              : "absolute -right-4 top-1/2 -translate-y-1/2 opacity-15"
          }
          style={framed ? undefined : { height: crest, width: crest }}
        />
      ) : null}
      <div className={`relative ${MAN[rank]} shrink-0`}>
        <PlayerImage
          player={{ code: face.code, name: face.name }}
          club={club}
          keeper={isGoalkeeper(face.position)}
          kickedOff
          // The splash stands him half a sheet tall: the 220px source would print soft.
          large={rank === "splash"}
          sizes={rank === "splash" ? "352px" : "224px"}
        />
      </div>
    </div>
  );
}
