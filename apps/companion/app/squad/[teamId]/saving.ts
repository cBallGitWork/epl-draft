// Whether this deployment may save a lineup to Fantrax: the `LINEUP_SAVE` flag and the
// commissioner's session, both from the environment. Never logged, never sent to a browser.

/** The commissioner's Fantrax cookie, or null when saving is switched off here. */
export function commissionerSession(): string | null {
  const session = process.env.FANTRAX_COOKIE;
  return process.env.LINEUP_SAVE === "on" && session ? session : null;
}
