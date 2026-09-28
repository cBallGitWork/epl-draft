// The club's name as a NEWSPAPER sets it, not as a fixtures grid abbreviates it.
//
// FPL's `name` is sized for a 60px column — "Nott'm Forest", "Man Utd", "Spurs"
// — and a production editor marked every one of them: those spellings have
// never been set in body copy and never will be. Craig, 18 Sep 2026: "ad use
// the full team name".
//
// **A lookup, and a fall-through rather than a fence.** A club not listed prints
// FPL's own name, so a promoted side is merely unabbreviated rather than
// missing. That is why this is not a `Record<Club, string>` the compiler polices
// — the twenty change every summer and the paper must not break in August.

const FULL: Record<string, string> = {
  "Nott'm Forest": "Nottingham Forest",
  "Man City": "Manchester City",
  "Man Utd": "Manchester United",
  Spurs: "Tottenham Hotspur",
  Wolves: "Wolverhampton Wanderers",
  Newcastle: "Newcastle United",
  Brighton: "Brighton & Hove Albion",
  Bournemouth: "AFC Bournemouth",
  "West Ham": "West Ham United",
  Leeds: "Leeds United",
};

export function fullClubName(name: string): string {
  return FULL[name] ?? name;
}

/** The second references a paper allows after the full name ("Tottenham", "Spurs"); none when the full name is already short. */
const SHORT: Record<string, string[]> = {
  Spurs: ["Tottenham", "Spurs"],
  "Aston Villa": ["Villa"],
  "Nott'm Forest": ["Forest"],
  "Man City": ["City"],
  "Man Utd": ["United"],
  "Crystal Palace": ["Palace"],
  Newcastle: ["Newcastle"],
  Brighton: ["Brighton"],
  Wolves: ["Wolves"],
  "West Ham": ["West Ham"],
  Leeds: ["Leeds"],
  "Coventry City": ["Coventry"],
  "Hull City": ["Hull"],
  "Ipswich Town": ["Ipswich"],
};

export function shortClubNames(name: string): string[] {
  return SHORT[name] ?? [];
}
