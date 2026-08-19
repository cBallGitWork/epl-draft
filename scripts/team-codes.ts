import { createHmac, randomBytes } from "node:crypto";
import { FANTRAX_LEAGUE_ID, fetchLeagueInfo, mapLeagueInfo } from "@epl/core";

// Hands the commissioner one code per team, and the environment variable that
// lets the app check them.
//
// Run it once per league, print the codes, distribute them, then throw this
// output away. The codes are not stored anywhere: what goes into the deployment
// is an HMAC of each one, so a leaked environment does not hand anybody a
// sign-in, and losing a code means issuing a new one rather than recovering it.
//
// Deliberately not automated into capture or CI. It writes a secret to a
// terminal, which is a thing a person should be present for.

/** Crockford-ish base32, without the letters that get misread aloud or in a
 *  handwritten note: no I, L, O, U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Eight characters of this alphabet is forty bits. There is no rate limiter in
 *  front of the sign-in, so length is most of the defence — at one guess per
 *  round trip, sixteen targets in a trillion is a long afternoon. */
const CODE_LENGTH = 8;

function code(): string {
  // Rejection-free because 256 is a multiple of 32: every byte maps to exactly
  // one symbol with no modulo bias.
  return [...randomBytes(CODE_LENGTH)].map((byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

async function main(): Promise<void> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error(
      "SESSION_SECRET is not set. Generate one first:\n" +
        "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"\n" +
        "then set it in .env.local and in the deployment, and re-run.",
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
