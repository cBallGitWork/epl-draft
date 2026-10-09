// The Premier League's feeds name a man by his Opta id; the paper keys him on FPL's season-stable code.

/** FPL code by Opta id, for every footballer FPL gives one. */
export function codesByOpta(players: readonly { code: number; optaCode: string | null }[]): Map<string, number> {
  return new Map(players.flatMap((p) => (p.optaCode === null ? [] : [[p.optaCode, p.code] as const])));
}
