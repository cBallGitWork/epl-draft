/** The server refuses to start without a league to serve: nothing in the code names one. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { FANTRAX_LEAGUE_ID, requireLeague } = await import("@epl/core");
  requireLeague(FANTRAX_LEAGUE_ID);
}
