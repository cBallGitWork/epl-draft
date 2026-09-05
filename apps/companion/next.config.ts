import type { NextConfig } from "next";

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
    // Player portraits and club crests come from the Premier League's CDN. Routing
    // them through the optimizer is not cosmetic: fifteen source headshots on a
    // pitch is 1.5 MB on a phone, and optimized they land around 15 KB each.
    // Never set `unoptimized` on these.
    //
    // Two paths, because the Premier League moved its portraits and left its
    // crests where they were. The allow-list is path-scoped, so the day the
    // portraits moved this file had to move with them — a pattern that only
    // named `/premierleague/**` fails every portrait at the optimizer, which is
    // a 400 from our own server and not a CDN problem to go looking for.
    remotePatterns: [
      { protocol: "https", hostname: "resources.premierleague.com", pathname: "/premierleague/**" },
      { protocol: "https", hostname: "resources.premierleague.com", pathname: "/premierleague25/**" },
      // Kits are FPL's own host, not the Premier League's CDN.
      { protocol: "https", hostname: "fantasy.premierleague.com", pathname: "/dist/img/shirts/**" },
      // The badge each manager picked for his fantasy team, off Fantrax's own
      // image host. Path-scoped like the rest: this prefix is the fantasy-team
      // icon set and nothing else on that host is ours to serve.
      //
      // Must stay in step with `FANTRAX_BADGE_BASE` in core's config, which the
      // mapper filters on so that a badge from anywhere else becomes no badge
      // rather than a 500 from our own optimizer.
      {
        protocol: "https",
        hostname: "fantraximg.com",
        pathname: "/assets/images/icons/fantasyteams/**",
      },
    ],
  },
};

export default nextConfig;
