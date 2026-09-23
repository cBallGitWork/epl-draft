import { FANTRAX_LEAGUE_ID } from "@epl/core";

// Which league this deployment serves, so CI asks production rather than keeping a copy that can
// disagree with it. The id is public: it is in the league's own URL.
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json({ leagueId: FANTRAX_LEAGUE_ID });
}
