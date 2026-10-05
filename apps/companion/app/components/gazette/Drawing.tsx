import Image from "next/image";
import type { PublishedStory } from "@epl/core";

// The lead's picture, when CI drew one: in the paper's frame, printed through the sheet's own two
// colours (`.paper-photo`), never as it arrived. No text ever sits on it.

export default function Drawing({ story }: { story: PublishedStory }) {
  if (story.image === null) return null;

  return (
    <figure className="bleed paper-photo paper-frame">
      <Image
        src={story.image.src}
        alt={story.image.alt}
        fill
        // Full-bleed on a phone, half the sheet on a desk: the browser is told rather than left to guess.
        sizes="(min-width: 64rem) 50vw, 100vw"
        className="object-cover"
        priority
      />
    </figure>
  );
}
