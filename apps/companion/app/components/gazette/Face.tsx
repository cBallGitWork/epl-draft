import Image from "next/image";
import { type Club, type StoryFace, clubColoursOf, crestUrl, isGoalkeeper } from "@epl/core";
import PlayerImage from "../league/PlayerImage";

// The man a story is about, printed at the rank the story runs at.
//
// **Three sizes, and the size is the hierarchy.** `docs/ui/gazetta.md` said
// until 3 Sep 2026 that "a page that gave every story a photograph would be a
// page with no lead on it", and that is true only while every photograph is the
// same size. The reference Craig handed over — a news site's front page on a
// phone — puts a picture on the splash, on both shoulders and on every brief,
// and reads as three ranks anyway, because the splash's is a band, a shoulder's
// is a card and a brief's is a thumbnail.
//
// One component and not three files: what varies between them is a height and a
// crest, which is a `Record` of literal class strings (DESIGN's Tailwind v4
// trap — a class name composed at runtime is a class name v4 drops).
//
// **He is chosen by the desk, never by the writer** — `assemble.faceOf` takes
// the highest-scoring man off the same numbers the brief was built from. So the
// picture cannot contradict the prose, and a model cannot name its way into the
// photograph.
//
// **It prints through the ink** (`.paper-face` in `paper.css`), band and all —
// the club's colour survives as the value that tells Forest from Chelsea rather
// than as the colour itself. A saturated club colour under every headline is the
// "themed screen rather than newsprint" DESIGN §4 warns about; the single band
// over the splash could afford one and a picture at every rank cannot.
//
// `PlayerImage` carries the four-rung ladder: this season's photograph, one of
// ours, his club's kit, his initials. **Never the stale 2024 path** — CLAUDE.md
// records that it still answers 200 with two-year-old shirts, and DESIGN §9 that
// a wrong photograph is worse than none, because only one of the two looks like
// an answer.

type Rank = "splash" | "shoulder" | "brief" | "portrait";

const BAND: Record<Rank, string> = {
  splash: "h-[8.5rem] @xl:h-[12rem]",
  shoulder: "h-[5.5rem]",
  // Beside a standfirst, and the ONE rank with no fixed height. Every other is
  // a band the man is cropped into, which is right where he is a mark on a
  // headline and wrong where he is the picture: a 5.5rem band cut him at the
  // chin and a 20rem one filled the column with his jaw. Here the frame takes
  // his own height, so the whole portrait prints.
  portrait: "h-auto",
  brief: "h-14 w-14 shrink-0 rounded-none",
};

/** How wide the cut-out stands in its band. */
const MAN: Record<Rank, string> = {
  splash: "w-[11rem]",
  shoulder: "w-[7rem]",
  portrait: "w-full",
  brief: "w-[3.25rem]",
};

/** The crest watermark, oversized and half out of frame — a watermark and not a
 *  label, because the club is already on his shirt. A brief has no room for one
 *  and prints the man alone. */
const CREST: Record<Rank, number | null> = {
  splash: 208,
  shoulder: 128,
  portrait: 150,
  brief: null,
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

  return (
    <div
      className={`paper-face flex justify-center overflow-hidden ${rank === "portrait" ? "items-stretch" : "items-end"} ${BAND[rank]} ${rank === "splash" ? "bleed" : ""}`}
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
          className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-15"
          style={{ height: crest, width: crest }}
        />
      ) : null}
      <div className={`relative ${MAN[rank]} shrink-0 ${rank === "portrait" ? "" : "pt-2"}`}>
        <PlayerImage
          player={{ code: face.code, name: face.name }}
          club={club}
          keeper={isGoalkeeper(face.position)}
          kickedOff
          sizes={rank === "splash" ? "352px" : "224px"}
        />
      </div>
    </div>
  );
}
