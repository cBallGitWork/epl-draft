import type { NextConfig } from "next";
import {
  FANTRAX_BADGE_BASE,
  FPL_SHIRT_BASE,
  PL_ASSET_BASE,
  PL_PHOTO_BASE,
  YOUTUBE_EMBED_BASE,
  YOUTUBE_THUMB_BASE,
} from "../../packages/core/src/config";

/** Every image host the app draws from, as core's config names them. */
const IMAGE_BASES = [PL_ASSET_BASE, PL_PHOTO_BASE, FPL_SHIRT_BASE, FANTRAX_BADGE_BASE, YOUTUBE_THUMB_BASE];

function under(base: string) {
  const url = new URL(base);
  return { protocol: "https" as const, hostname: url.hostname, pathname: `${url.pathname}/**` };
}

const dev = process.env.NODE_ENV === "development";

/** Vercel's preview toolbar, by directive, on preview deployments only. */
const TOOLBAR: Record<string, string> =
  process.env.VERCEL_ENV === "preview"
    ? {
        script: " https://vercel.live",
        style: " https://vercel.live",
        img: " https://vercel.live https://vercel.com",
        font: " https://vercel.live https://assets.vercel.com",
        connect: " https://vercel.live wss://ws-us3.pusher.com",
        frame: " https://vercel.live",
      }
    : {};

const IMAGE_ORIGINS = [...new Set(IMAGE_BASES.map((base) => new URL(base).origin))].join(" ");

/** Next inlines its RSC payload as scripts, and a nonce would make every page dynamic,
 *  so scripts keep 'unsafe-inline'. Every origin comes from core's config. */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}${TOOLBAR.script ?? ""}`,
  `style-src 'self' 'unsafe-inline'${TOOLBAR.style ?? ""}`,
  `img-src 'self' data: blob: ${IMAGE_ORIGINS}${TOOLBAR.img ?? ""}`,
  `font-src 'self'${TOOLBAR.font ?? ""}`,
  `connect-src 'self'${dev ? " ws:" : ""}${TOOLBAR.connect ?? ""}`,
  `frame-src ${new URL(YOUTUBE_EMBED_BASE).origin}${TOOLBAR.frame ?? ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // `@epl/core` ships raw TypeScript (no build step), so Next has to compile it.
  transpilePackages: ["@epl/core"],

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

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Not `no-referrer`: YouTube's embed refuses to play without the origin.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

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
