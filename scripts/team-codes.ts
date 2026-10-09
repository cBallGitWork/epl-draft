import { createHmac, randomBytes } from "node:crypto";
import { FANTRAX_LEAGUE_ID, fetchLeagueInfo, mapLeagueInfo, requireLeague } from "@epl/core";

// One code per team for the commissioner, and TEAM_CODES (an HMAC of each) for the app. The codes are kept nowhere:
// a leaked TEAM_CODES gives nobody a code, but a leaked SESSION_SECRET signs in as anyone, so rotate it and reissue.
// Run by hand, never in capture or CI: it prints secrets to a terminal.

/** Crockford-ish base32, without the letters misread aloud or in a note: no I, L, O, U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Forty bits: with no rate limiter in front of the sign-in, length is most of the defence. */
const CODE_LENGTH = 8;

function code(): string {
  // 256 is a multiple of 32, so the modulo has no bias.
  return [...randomBytes(CODE_LENGTH)].map((byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

async function main(): Promise<void> {
  requireLeague(FANTRAX_LEAGUE_ID);
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
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

// Not awaited: these scripts transpile to CJS, and a rejection should crash loudly.
void main();
