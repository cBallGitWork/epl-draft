import type { LeaguePlayer } from "../league/types";
import { fplNameVariants, normalizeName, surname, tokens } from "./normalize";
import { tokenSetRatio } from "./similarity";

// What counts as the same footballer written two ways. Kept apart from match.ts,
// which decides who gets assigned to whom: one file answers "are these the same
// name", the other "given that, who claims whom".

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

/** Does `candidate` plausibly contain `name`, or is it a different player who
 *  merely shares a given name?
 *
 *  token_set_ratio scores containment at 100, so "Gabriel" ties perfectly with
 *  Arsenal's "Gabriel" AND with "Gabriel Jesus". Requiring the surname token to
 *  appear rejects the wrong one while accepting every genuine case — FPL's bare
 *  "Raya" still matches "David Raya Martín".
 *
 *  `name` must be in reading order. Fantrax's raw form is surname-first, where
 *  the last token is the GIVEN name — guarding on that asks whether the
 *  candidate contains "Danny", and rejects Daniel Ballard for not being called
 *  Danny. */
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
