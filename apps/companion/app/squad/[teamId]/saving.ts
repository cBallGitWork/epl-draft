// Whether this deployment may save a team's lineup to Fantrax: the `LINEUP_SAVE` flag and the
// commissioner's session, both from the environment. Never logged, never sent to a browser.

/** `on` lets every team save, a comma-separated list of Fantrax team ids only those; anything else is off. */
export function saveAllowed(flag: string | undefined, teamId: string): boolean {
  const value = flag?.trim() ?? "";
  if (value === "on") return true;
  return teamId !== "" && value.split(",").some((id) => id.trim() === teamId);
}

/** The commissioner's Fantrax cookie, or null when saving is switched off for this team. */
export function commissionerSession(teamId: string): string | null {
  const session = process.env.FANTRAX_COOKIE;
  return saveAllowed(process.env.LINEUP_SAVE, teamId) && session ? session : null;
}
