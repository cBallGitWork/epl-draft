import { cookies } from "next/headers";
import { DEMO_TEAM_ID, TEAM_COOKIE } from "./config";
import { lentTeam } from "./demoTeam";
import { cookieTeamOf, cookieValue, hmac, sameSecret } from "./sessionCookie";

// Who is holding the phone: one code per team from the commissioner, kept in a signed cookie, never a pick-list.
// The code authorises lineup writes; reading stays open. Secrets are read here, at the edge.

function secret(): string | null {
  // `||`, not `??`: an empty secret would sign with a key anybody can compute.
  return process.env.SESSION_SECRET || null;
}

/** `teamId → HMAC of that team's code`, from `npm run team-codes`, set in the deployment and never in git. */
function codeHashes(): Record<string, string> {
  const raw = process.env.TEAM_CODES;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    // A malformed map lets nobody in, which is visible; half-parsed JSON is never guessed at.
    return {};
  }
}

/** The team whose code this is, or null. */
export async function teamForCode(code: string): Promise<string | null> {
  const key = secret();
  const trimmed = code.trim().toUpperCase();
  if (key === null || trimmed === "") return null;

  const attempt = await hmac(trimmed, key);
  const match = Object.entries(codeHashes()).find(([, hash]) => sameSecret(hash, attempt));
  return match?.[0] ?? null;
}

/** The signed cookie value for a team; an unsigned one would let anybody claim any team. */
export async function sign(teamId: string): Promise<string | null> {
  const key = secret();
  return key === null ? null : cookieValue(teamId, key);
}

/** Whose team this browser is in the league served (else the demo team), or null. */
export async function myTeamId(teams: readonly { teamId: string }[]): Promise<string | null> {
  // The cookie first, always: `cookies()` keeps these pages from being prerendered; one for another league is none.
  return (await signedTeamId(teams)) ?? lentTeam(teams, DEMO_TEAM_ID);
}

/** The verified team in this browser's cookie, or null, with no league check and never the demo team. */
async function cookieTeam(): Promise<string | null> {
  const raw = (await cookies()).get(TEAM_COOKIE)?.value;
  const key = secret();
  if (key === null || !raw) return null;
  return cookieTeamOf(raw, key);
}

/** The team this browser signed in as, in this league; never the demo team. A write asks this. */
export async function signedTeamId(teams: readonly { teamId: string }[]): Promise<string | null> {
  const signed = await cookieTeam();
  return signed !== null && teams.some((team) => team.teamId === signed) ? signed : null;
}

/** Whether this browser holds a real code rather than the lent demo team. */
export async function signedIn(): Promise<boolean> {
  return (await cookieTeam()) !== null;
}
