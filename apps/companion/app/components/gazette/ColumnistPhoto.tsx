import Image from "next/image";
import type { Columnist } from "@/app/config";

// A columnist's photograph at each rank the paper prints a picture, through the sheet's ink the
// way the drawing is (`.paper-photo`): a photograph, never a colour plate.

type Rank = "splash" | "shoulder" | "brief" | "card";

const FRAME: Record<Rank, string> = {
  splash: "bleed aspect-[16/9]",
  shoulder: "h-[5.5rem] w-full",
  brief: "h-14 w-14 shrink-0",
  card: "h-16 w-24 shrink-0",
};

export default function ColumnistPhoto({ photo, rank }: { photo: Columnist["photo"]; rank: Rank }) {
  return (
    <figure className={`paper-photo relative overflow-hidden ${FRAME[rank]}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={rank === "splash" ? "100vw" : "192px"}
        className="object-cover"
        placeholder="blur"
        blurDataURL={photo.blur}
        priority={rank === "splash"}
      />
    </figure>
  );
}
