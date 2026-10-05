// A fantasy team's own colours.
//
// **This is `football/clubs.ts`'s pattern, not its table.** Those twenty rows
// belong to the twenty Premier League clubs and are keyed on FPL's `shortName`;
// these belong to the ten managers in our league.
//
// **`TeamColours` is declared here rather than imported**, though it is
// structurally identical to `ClubColours` next door. The layers may not import
// each other — `league/calendar.ts` declares its own `GameweekKickoff` for the
// same reason rather than importing `Fixture` — and two identical shapes on
// either side of that line is the split working, not duplication to clean up.
// The ink picker is a different matter: `inkOn` takes `{primary}` and is a
// statement about a colour rather than about a club, so a call site may hand it
// either.
//
// **Where a team's colour is allowed to appear is Championship Manager's own
// answer, and it is narrow.** The game does not theme a page by club: every
// screen in the reference library is drawn over the match photograph, and the
// club's colour appears in exactly one place — the header of a MATCH, where
// `cm9900/21.jpg` sets Everton's blue against Arsenal's red and `16.jpg` sets
// the same blue against Torquay's white. The colour identifies a SIDE in a
// confrontation. So this is spent on the team's own title bar and on each side
// of a head-to-head, and nowhere else; the ground stays the photograph and
// `--color-accent` keeps meaning "yours".
//
// **Keyed on `teamId` and never on the name.** `LeagueTeam.name` is a manager's
// to change whenever he likes — the type says so — and a colour table keyed on
// it would repaint somebody the day he renamed his side.
//
// **The ids are league-specific, and that is a fact about swap day.** Twenty
// rows below, ten per league, for the same ten NAMES — the rehearsal league and
// the dummy one file "test2" under different strings, which is the clearest
// possible demonstration of why this is keyed on the id and not the name.
//
// The real league's ten are a third set; a team not yet listed takes `FALLBACK`,
// exactly as an unstyled promoted club takes one.

/** A team's plate and the trim on it. Same shape as the football layer's
 *  `ClubColours` and deliberately not the same type — see above. */
export interface TeamColours {
  /** The plate the team's name is set on. */
  primary: string;
  /** Trim, for anything that needs a second colour off the same identity. */
  secondary: string;
}

const TEAM_COLOURS: Record<string, TeamColours> = {
  // The rehearsal league's ten, so the mechanism ships with something to look at
  // rather than a table of nothing testing only its own fallback. Ten hues far
  // enough apart to tell two sides of a fixture apart at a glance, which is the
  // one job the colour has. `inkOn` picks the ink for each, so a pale one is a
  // dark-ink plate rather than an unreadable one — `cm9900/16.jpg` runs Everton
  // against a WHITE Torquay, so a light side is a case the reference has and not
  // an edge we invented.
  // The REHEARSAL league (`data/snapshots/.../rehearsal`).
  pbxm9fgimshcpazf: { primary: "#0b5cd5", secondary: "#FFFFFF" }, // test2
  j9zadacnmshcpazf: { primary: "#c81e2b", secondary: "#FFFFFF" }, // test3
  "8enbgqo5msgb375j": { primary: "#1f9d55", secondary: "#FFFFFF" }, // 123
  jtsmt5jxmtj31znh: { primary: "#7a3fbf", secondary: "#FFFFFF" }, // test1
  sezrgvl2mshcpazf: { primary: "#e08a00", secondary: "#1a1a1a" }, // test4
  dq2yk3zxmtj31znh: { primary: "#0e8f8f", secondary: "#FFFFFF" }, // test211
  v6bxgqm5mtj31znh: { primary: "#b03060", secondary: "#FFFFFF" }, // test31
  yf96763gmtj31zni: { primary: "#4a5568", secondary: "#FFFFFF" }, // test31121
  mxet9tt7mtj31zni: { primary: "#d9d2c5", secondary: "#1a1a1a" }, // testf
  vzqubu25mtj31zni: { primary: "#8b5a2b", secondary: "#FFFFFF" }, // test3331

  // The DUMMY league, which is what `next dev` serves by default — so without
  // these ten the whole mechanism is invisible on the machine it is built on,
  // and both sides of a fixture draw in the same fallback blue. Same names, same
  // colours, different ids: two leagues is exactly why this is keyed on the id.
  "1b6gp5utmtj36y3g": { primary: "#0b5cd5", secondary: "#FFFFFF" }, // test2
  y6viv6jfmtj36y3g: { primary: "#c81e2b", secondary: "#FFFFFF" }, // test3
  "98yx3o50mtj36y3g": { primary: "#1f9d55", secondary: "#FFFFFF" }, // 123
  hy0w28p5mtj36y3g: { primary: "#7a3fbf", secondary: "#FFFFFF" }, // test1
  deo9ljvtmtj36y3g: { primary: "#e08a00", secondary: "#1a1a1a" }, // test4
  fq5omv5kmtj36y3g: { primary: "#0e8f8f", secondary: "#FFFFFF" }, // test211
  dpdkp2bbmtj36y3g: { primary: "#b03060", secondary: "#FFFFFF" }, // test31
  g80h3bf5mtj36y3g: { primary: "#4a5568", secondary: "#FFFFFF" }, // test31121
  pzmd243ymtj36y3g: { primary: "#d9d2c5", secondary: "#1a1a1a" }, // testf
  kg18w2cvmtj36y3g: { primary: "#8b5a2b", secondary: "#FFFFFF" }, // test3331

  // The REAL league, in each manager's own colours (Craig, 5 Oct 2026).
  l5kunst8msgbirdf: { primary: "#0b5cd5", secondary: "#FFFFFF" }, // Ball: blue/white
  kpj0z744muh1qwtd: { primary: "#c81e2b", secondary: "#FFFFFF" }, // Nick: red/white
  "7to6xosimu8hyyw5": { primary: "#0b5cd5", secondary: "#FFFFFF" }, // Traf: blue/white
  "0g0j5mkomuqqwsbu": { primary: "#009246", secondary: "#ce2b37" }, // Dome: Italy
  qgucu9dgmufwva1x: { primary: "#008751", secondary: "#FFFFFF" }, // Ohi: Nigeria
};

/** The neutral, for a team nobody has styled yet. Chrome blue rather than the clubs' grey: a fantasy team's bar is the
 *  CM title bar, and an unstyled one should look like the title bar it already
 *  is rather than like a mistake. */
const FALLBACK: TeamColours = { primary: "#1d3f9e", secondary: "#FFFFFF" };

export function teamColours(teamId: string): TeamColours {
  return TEAM_COLOURS[teamId] ?? FALLBACK;
}
