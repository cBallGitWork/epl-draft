import Image from "next/image";
import type { PublishedStory } from "@epl/core";

// The lead's picture, when CI drew one.
//
// **Printed in the sheet's own two colours, never as it arrived.** The
// treatment is `.paper-photo` in `paper.css`: grayscale toward the ink,
// multiplied against the rosa so the stock shows through the midtones, and a
// halftone screen over it. A colour drawing dropped onto newsprint is the
// single fastest way to make this page look like a website again.
//
// No text ever sits on the picture, so the contrast floor is untouched — the
// headline and deck are below it, where a paper puts them.

/** The band's printed height, in the same proportion `Picture` uses. */
const BAND = "aspect-[16/9]";

export default function Splash({ story }: { story: PublishedStory }) {
  if (story.image === null) return null;

  return (
    <figure className={`bleed paper-photo relative ${BAND} overflow-hidden`}>
      <Image
        src={story.image.src}
        alt={story.image.alt}
        fill
        // The band is full-bleed at every width the paper is read at, so the
        // browser may as well be told rather than left to guess from a layout
        // it has not done yet.
        sizes="100vw"
        className="object-cover"
        priority
      />
    </figure>
  );
}
