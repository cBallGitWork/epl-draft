// Whether a live tie has men on both its sides in one Premier League fixture.

/** One live pairing's presence in one fixture. */
interface TieStake {
  homeTeamId: string;
  awayTeamId: string;
  /** Active rostered men each side of the PAIRING has in this fixture. */
  homeMen: number;
  awayMen: number;
}

/** Whether a live pairing has men on both its sides in this fixture. */
export function bothSides(tie: TieStake): boolean {
  return tie.homeMen > 0 && tie.awayMen > 0;
}
