// A CI firing with no league chosen writes about the dummy league, and the served paper filters those stories out.

type Env = Partial<Record<string, string>>;

/** Throws when CI runs the writer without `FANTRAX_LEAGUE_ID`; local runs keep the default. */
export function requireLeagueInCi(env: Env): void {
  if (env.CI && !env.FANTRAX_LEAGUE_ID) {
    throw new Error(
      "FANTRAX_LEAGUE_ID is not set in CI, so this firing would write about the dummy league. " +
        "Set the repository variable (`gh variable set FANTRAX_LEAGUE_ID`) to the league production serves.",
    );
  }
}
