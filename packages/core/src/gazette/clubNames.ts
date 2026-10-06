// A club's name as a newspaper sets it, from FPL's short `name`; a club not listed prints FPL's own.

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
