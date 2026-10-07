import type { LeaguePlayer } from "../league/types";
import { fplNameVariants, normalizeName, surname, tokens } from "./normalize";
import { tokenSetRatio } from "./similarity";

// Whether two spellings are the same footballer; match.ts decides who claims whom.

/** The FPL side of the match, reduced to what matching needs. */
export interface FplCandidate {
  code: number;
  firstName: string;
  secondName: string;
  webName: string;
  clubCode: string;
}

export function candidateName(candidate: FplCandidate): string {
  return `${candidate.firstName} ${candidate.secondName}`.trim();
}

/** Whether `candidate` carries `name`'s surname, since containment scores 100 ("Gabriel" in "Gabriel Jesus").
 *  `name` must be in reading order: Fantrax's surname-first form ends on the given name. */
export function surnameAgrees(name: string, candidate: FplCandidate): boolean {
  const target = surname(name);
  if (target === "") return false;
  const candidateTokens = new Set([
    ...tokens(candidateName(candidate)),
    ...tokens(candidate.webName),
  ]);
  return candidateTokens.has(target);
}

/** Best score across every spelling of the candidate FPL publishes. */
export function scoreAgainst(name: string, candidate: FplCandidate): number {
  return Math.max(...fplNameVariants(candidate).map((variant) => tokenSetRatio(name, variant)));
}

/** Every spelling of the Fantrax player worth matching on: their name as given,
 *  and — when it is in surname-first form — the reading-order flip. */
export function fantraxForms(player: LeaguePlayer): string[] {
  return [...new Set([normalizeName(player.rawName), normalizeName(player.displayName)])].filter(
    (form) => form !== "",
  );
}

/** Is this Fantrax name an exact hit on any spelling of this candidate? */
export function isExactHit(forms: string[], candidate: FplCandidate): boolean {
  const variants = fplNameVariants(candidate);
  return forms.some((form) => variants.includes(form));
}
