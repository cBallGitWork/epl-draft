export type Pairing = readonly [home: string, away: string];

/** Every team meets every other once, a round at a time; in an odd group one sits each round out. */
export function roundRobin(teamIds: readonly string[]): Pairing[][] {
  if (teamIds.length < 2) return [];
  // The circle method: the first place stays put and the rest turn one step a round.
  const wheel: (string | null)[] = teamIds.length % 2 === 0 ? [...teamIds] : [...teamIds, null];
  const size = wheel.length;
  const rounds: Pairing[][] = [];

  for (let round = 0; round < size - 1; round++) {
    const pairings: Pairing[] = [];
    for (let at = 0; at < size / 2; at++) {
      const home = wheel[at];
      const away = wheel[size - 1 - at];
      if (home != null && away != null) pairings.push([home, away]);
    }
    rounds.push(pairings);
    wheel.splice(1, 0, ...wheel.splice(size - 1, 1));
  }
  return rounds;
}
