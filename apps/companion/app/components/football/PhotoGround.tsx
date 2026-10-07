"use client";

import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { clubGroundPhoto } from "@epl/core";
import { drawsOwnGround, isPaperRoute } from "../shell/sections";
import { DESK_GROUND, DESK_GROUND_BLUR } from "../../config";

// The darkened photograph behind every desk screen, and never behind the paper.

/** This bright is safe only while no desk text sits on the bare ground (a plate or panel carries it):
 *  `tools/ui/groundfit.mjs` checks that; `sweep` cannot, as a `fixed -z-10` layer is nobody's ancestor. */
const SCRIM = 1;
const DARKEN = 0.55;

export default function PhotoGround({
  faces = [],
  subject,
  photo,
}: {
  faces?: readonly string[];
  /** The short name of the club this screen is about, or null for a subject with none. Left off (not
   *  null) by the shell, which then stands down on a route whose subject draws its own ground. */
  subject?: string | null;
  /** A picture the subject already chose in place of a club's: a head-to-head's home venue. */
  photo?: { src: string; blur?: string } | null;
}) {
  const pathname = usePathname();
  if (isPaperRoute(pathname)) return null;
  // Asked by the shell, on a route where a Shell below draws its own.
  if (subject === undefined && photo === undefined && drawsOwnGround(pathname)) return null;

  // A club with no photograph (`clubGroundPhoto` is null for a promoted club) falls back to the desk's.
  // One lookup, so a picture never travels with another stadium's blur.
  const chosen = photo ?? (subject === undefined || subject === null ? null : clubGroundPhoto(subject));
  const ground = chosen?.src ?? DESK_GROUND;
  // The desk's own picture keeps its own placeholder, whoever chose it.
  const blur = chosen?.blur ?? (ground === DESK_GROUND ? DESK_GROUND_BLUR : null);
  if (ground === null && faces.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 flex items-end justify-center gap-[1vw] overflow-hidden"
      // Darkened, never greyed.
      style={{ opacity: SCRIM, filter: `brightness(${DARKEN})` }}
    >
      {ground === null ? (
        // With no photograph, the portraits of men in this gameweek stand in.
        faces.map((src) => <Face key={src} src={src} />)
      ) : (
        <Image
          src={ground}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
          // The blur paints the frame between two Shells' grounds, so a navigation never flashes black.
          // Conditional: `placeholder="blur"` without a `blurDataURL` throws on a non-static import.
          {...(blur === null
            ? {}
            : { placeholder: "blur" as const, blurDataURL: blur })}
        />
      )}
    </div>
  );
}

/** One of the crowd; a portrait that fails leaves a gap rather than a broken-image box. */
function Face({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <span className="relative h-[42svh] w-[16vw] max-w-[9rem] shrink-0">
      <Image
        src={src}
        alt=""
        fill
        sizes="16vw"
        onError={() => setFailed(true)}
        className="object-contain object-bottom"
      />
    </span>
  );
}
