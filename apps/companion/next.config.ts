import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `@epl/core` ships raw TypeScript (no build step), so Next has to compile it.
  transpilePackages: ["@epl/core", "@epl/ui"],

  // The old URLs have been shared in a sixteen-person group chat, so they keep
  // working rather than 404ing on someone who scrolled back to find one.
  async redirects() {
    return [
      { source: "/standings", destination: "/league", permanent: true },
      { source: "/matchup", destination: "/league/matchups", permanent: true },
      { source: "/team", destination: "/squad", permanent: true },
      { source: "/team/:teamId", destination: "/squad/:teamId", permanent: true },
    ];
  },

  images: {
    // Player portraits and club crests come from the Premier League's CDN. Routing
    // them through the optimizer is not cosmetic: the source headshots are ~330 KB
    // PNGs, and eleven of them on a pitch is 3.6 MB on a phone. Optimized they land
    // around 15 KB each. Never set `unoptimized` on these.
    remotePatterns: [
      { protocol: "https", hostname: "resources.premierleague.com", pathname: "/premierleague/**" },
    ],
  },
};

export default nextConfig;
