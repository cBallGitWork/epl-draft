import type { NextConfig } from "next";
import {
  FANTRAX_BADGE_BASE,
  FPL_SHIRT_BASE,
  PL_ASSET_BASE,
  PL_PHOTO_BASE,
} from "../../packages/core/src/config";

/** Every image host the app draws from, as core's config names them. */
const IMAGE_BASES = [PL_ASSET_BASE, PL_PHOTO_BASE, FPL_SHIRT_BASE, FANTRAX_BADGE_BASE];

function under(base: string) {
  const url = new URL(base);
  return { protocol: "https" as const, hostname: url.hostname, pathname: `${url.pathname}/**` };
}

const nextConfig: NextConfig = {
  // `@epl/core` ships raw TypeScript (no build step), so Next has to compile it.
  transpilePackages: ["@epl/core", "@epl/ui"],

  // The dev overlay's own badge, off. It is a fixed circle in the bottom-left
  // corner of every dev render, which is where the foot row's first plate is —
  // so GAZETTA has been half-covered in every screenshot this app has taken.
  // The instruments read the dev server, so a badge over a nav plate is a badge
  // over the thing being measured.
  //
  // `false` and not a `position`: moving it puts it on a different plate. Build
  // and runtime errors still surface — this is the idle indicator only, and 16.2
  // takes `false | { position }` for it.
  devIndicators: false,

  // The old URLs have been shared in a sixteen-person group chat, so they keep
  // working rather than 404ing on someone who scrolled back to find one.
  async redirects() {
    return [
      { source: "/standings", destination: "/league", permanent: true },
      { source: "/matchup", destination: "/league/matchups", permanent: true },
      { source: "/team", destination: "/squad", permanent: true },
      { source: "/team/:teamId", destination: "/squad/:teamId", permanent: true },
      // A prefix is not a page: `/paper` is where the paper's inside pages
      // live, and the paper's own front is `/`.
      { source: "/paper", destination: "/", permanent: true },
    ];
  },

  images: {
    // Portraits are ~330 KB at source and ~15 KB optimized, so never set `unoptimized` on them.
    // Path-scoped: a prefix not in the config is a 400 from our own optimizer.
    remotePatterns: IMAGE_BASES.map(under),
  },
};

export default nextConfig;
