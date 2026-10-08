import { createHmac, randomBytes } from "node:crypto";
import { FANTRAX_LEAGUE_ID, fetchLeagueInfo, mapLeagueInfo, requireLeague } from "@epl/core";

// One code per team for the commissioner, and TEAM_CODES (an HMAC of each) for the app. The codes are kept nowhere:
// a leaked TEAM_CODES gives nobody a code, but a leaked SESSION_SECRET signs in as anyone, so rotate it and reissue.
// Run by hand, never in capture or CI: it prints secrets to a terminal.

/** Crockford-ish base32, without the letters that get misread aloud or in a
 *  handwritten note: no I, L, O, U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Eight characters of this alphabet is forty bits. There is no rate limiter in
 *  front of the sign-in, so length is most of the defence — at one guess per
 *  round trip, ten targets in a trillion is a long afternoon. */
const CODE_LENGTH = 8;

function code(): string {
  // Rejection-free because 256 is a multiple of 32: every byte maps to exactly
  // one symbol with no modulo bias.
  return [...randomBytes(CODE_LENGTH)].map((byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

async function main(): Promise<void> {
  requireLeague(FANTRAX_LEAGUE_ID);
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Names the file, since only one of the two is the one the app verifies against; the last line stops a
    // new secret going over one that already signs every code issued.
    console.error(
      "SESSION_SECRET is not in apps/companion/.env.local, which is the file the app\n" +
        "verifies codes against. Add it there, and the same value in the deployment:\n" +
        "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"\n" +
        "Changing a value already there invalidates every code issued under it.",
    );
    process.exitCode = 1;
    return;
  }

  const info = mapLeagueInfo(await fetchLeagueInfo(FANTRAX_LEAGUE_ID));
  if (info.teams.length === 0) {
    console.error(`${info.name} has no teams yet, so there is nobody to issue a code to.`);
    process.exitCode = 1;
    return;
  }

  const hashes: Record<string, string> = {};

  console.log(`\n${info.name} — one code each. Send each manager only their own row.\n`);
  for (const team of info.teams) {
    const issued = code();
    hashes[team.teamId] = createHmac("sha256", secret).update(issued).digest("hex");
    console.log(`  ${team.name.padEnd(24)} ${issued}`);
  }

  console.log("\nSet this in the deployment as TEAM_CODES (one line):\n");
  console.log(JSON.stringify(hashes));
  console.log("\nThe codes above are not recoverable from it. Re-run to reissue.\n");
}

// Not awaited at the top level: these scripts transpile to CJS, and a rejection
// here should crash the run loudly rather than be caught and softened.
void main();
