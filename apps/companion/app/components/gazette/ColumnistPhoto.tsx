import Image from "next/image";
import type { Columnist } from "@/app/config";

// A columnist's photograph at each rank the paper prints a picture, through the sheet's ink the
// way the drawing is (`.paper-photo`): a photograph, never a colour plate.

type Rank = "splash" | "card" | "banner";

const FRAME: Record<Rank, string> = {
  splash: "paper-frame bleed",
  card: "paper-frame",
  banner: "h-20 w-20 shrink-0 @xl:h-24 @xl:w-24",
};

/** What the optimizer may serve: a card is a column of the front page's grid, or half a phone. */
const SIZES: Record<Rank, string> = {
  splash: "(min-width: 64rem) 50vw, 100vw",
  card: "(min-width: 64rem) 320px, 50vw",
  banner: "192px",
};

export default function ColumnistPhoto({ photo, rank }: { photo: Columnist["photo"]; rank: Rank }) {
  return (
    <figure className={`paper-photo relative overflow-hidden ${FRAME[rank]}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={SIZES[rank]}
        className="object-cover"
        style={{ objectPosition: photo.focus }}
        placeholder="blur"
        blurDataURL={photo.blur}
        priority={rank === "splash"}
      />
    </figure>
  );
}
