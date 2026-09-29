import Image from "next/image";
import { YOUTUBE_EMBED_BASE, YOUTUBE_THUMB_BASE } from "@epl/core";

// A match's highlights as the page opens on them: Sky's still with a play mark, and the player only once a reader taps it.
// A closed <details> renders nothing inside it, so no page loads five players it was never asked for; no script needed.

export default function Highlights({ id, title }: { id: string; title: string }) {
  return (
    <details className="group">
      <summary className="relative block aspect-video w-full max-w-full cursor-pointer list-none overflow-hidden group-open:hidden [&::-webkit-details-marker]:hidden">
        <Image src={`${YOUTUBE_THUMB_BASE}/${id}/hqdefault.jpg`} alt={`${title}, highlights`} fill sizes="(min-width: 1024px) 40rem, 100vw" className="object-cover" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/80 text-bg" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
        <span className="sr-only">Play the highlights</span>
      </summary>
      <div className="aspect-video w-full max-w-full overflow-hidden">
        <iframe
          src={`${YOUTUBE_EMBED_BASE}/${id}?autoplay=1`}
          title={`${title}, highlights`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </details>
  );
}
