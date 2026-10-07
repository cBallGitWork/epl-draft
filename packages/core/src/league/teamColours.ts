// A fantasy team's own colours, keyed on `teamId` and never the renamable name; an unlisted team takes `FALLBACK`.
// Spent only on the team's own title bar and each side of a head-to-head.

/** A team's plate and its trim: `ClubColours`' shape, declared apart because the layers may not import each other. */
interface TeamColours {
  /** The plate the team's name is set on. */
  primary: string;
  /** Trim, for anything that needs a second colour off the same identity. */
  secondary: string;
}

const TEAM_COLOURS: Record<string, TeamColours> = {
  // The rehearsal league's ten; `inkOn` picks each plate's ink, so a pale one stays readable.
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

  // The dummy league's ten: the same names and colours under different ids.
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

  // The real league, in each manager's own colours.
  l5kunst8msgbirdf: { primary: "#111111", secondary: "#FFFFFF" }, // Ball: black/white
  kpj0z744muh1qwtd: { primary: "#c81e2b", secondary: "#FFFFFF" }, // Nick: red/white
  "7to6xosimu8hyyw5": { primary: "#0b5cd5", secondary: "#FFFFFF" }, // Traf: blue/white
  "0g0j5mkomuqqwsbu": { primary: "#009246", secondary: "#ce2b37" }, // Dome: Italy
  qgucu9dgmufwva1x: { primary: "#008751", secondary: "#FFFFFF" }, // Ohi: Nigeria
  uexqrijomu8l5asi: { primary: "#c81e2b", secondary: "#FFFFFF" }, // Ben: red/white
  syjkob6cmuobagfu: { primary: "#c81e2b", secondary: "#FFFFFF" }, // O'Shea: red
  aekx2715mtzgcl3f: { primary: "#008751", secondary: "#FFFFFF" }, // Algie: green/white
  "7z8fy0pnmuogbtdw": { primary: "#0b5cd5", secondary: "#FFFFFF" }, // Fellows: blue/white
  ipnp5y4mmu9j7kop: { primary: "#f2b705", secondary: "#0b5cd5" }, // Richy: Clare saffron/blue
};

/** The neutral for a team nobody has styled: the title bar's own chrome blue, not the clubs' grey. */
const FALLBACK: TeamColours = { primary: "#1d3f9e", secondary: "#FFFFFF" };

export function teamColours(teamId: string): TeamColours {
  return TEAM_COLOURS[teamId] ?? FALLBACK;
}
