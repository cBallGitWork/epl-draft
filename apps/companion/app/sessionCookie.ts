// The team cookie's format and its signature, apart from `cookies()` so both can be tested.

export async function hmac(value: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const imported = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", imported, encoder.encode(value));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Length-independent comparison. Both sides here are hex of a fixed width, so
 *  this is belt and braces rather than the only thing standing up. */
export function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

/** Bumped to sign everybody out at once. */
const COOKIE_VERSION = "v1";

/** The cookie's own key, derived from the secret, so a cookie signature and a code hash never
 *  share one. */
function cookieKey(secret: string): Promise<string> {
  return hmac("cookie", secret);
}

/** The signed cookie value for a team: `v1.<teamId>.<signature>`. */
export async function cookieValue(teamId: string, secret: string): Promise<string> {
  return `${COOKIE_VERSION}.${teamId}.${await hmac(teamId, await cookieKey(secret))}`;
}

/** The team a cookie was signed for, or null. Compared with `sameSecret`, never `===`. */
export async function cookieTeamOf(raw: string, secret: string): Promise<string | null> {
  const [version, teamId, signature, ...rest] = raw.split(".");
  if (version !== COOKIE_VERSION || !teamId || !signature || rest.length > 0) return null;
  return sameSecret(signature, await hmac(teamId, await cookieKey(secret))) ? teamId : null;
}
