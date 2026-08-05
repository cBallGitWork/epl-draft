import type { LeaguePlayer } from "../league/types";
import { type Bridge, type MappedEntry, claimedCodes, settledIds } from "./bridge";
import { toFplClubCode } from "./clubCodes";
import { fplNameVariants, normalizeName, surname, tokens } from "./normalize";
import { AMBIGUITY_MARGIN, FUZZY_MIN_SCORE, tokenSetRatio } from "./similarity";

// Deciding which FPL player a Fantrax player is. The one rule that matters: when
// it is not sure, it says so. A wrong row here is a player's whole season
// attributed to someone else, and nothing downstream would ever question it.

/** The FPL side of the match, reduced to what matching needs. */
export interface FplCandidate {
  code: number;
  firstName: string;
  secondName: string;
  webName: string;
  clubCode: string;
}

/** A Fantrax player we could not settle, with what we considered, so a human can
 *  decide in one sitting instead of re-deriving the problem. */
export interface Proposal {
  fantraxId: string;
  fantraxName: string;
  clubCode: string | null;
  /** Fantrax's position. Shown because it helps a human, never used to decide —
   *  the commissioner can change it whenever they like. */
  positionHint: string | null;
  candidates: { fplCode: number; name: string; score: number }[];
  reason: "no-candidates" | "below-threshold" | "ambiguous" | "identity-taken";
}

export interface MatchResult {
  matches: Record<string, MappedEntry>;
  proposals: Proposal[];
}

type Aliases = Record<string, string>;

function candidateName(candidate: FplCandidate): string {
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
function surnameAgrees(name: string, candidate: FplCandidate): boolean {
  const target = surname(name);
  if (target === "") return false;
  const candidateTokens = new Set([
    ...tokens(candidateName(candidate)),
    ...tokens(candidate.webName),
  ]);
  return candidateTokens.has(target);
}

function scoreAgainst(name: string, candidate: FplCandidate): number {
  return Math.max(
    ...fplNameVariants(candidate).map((variant) => tokenSetRatio(name, variant)),
  );
}

/** Every spelling of the Fantrax player worth matching on: their name as given,
 *  and — when it is in surname-first form — the reading-order flip. */
function fantraxForms(player: LeaguePlayer): string[] {
  return [...new Set([normalizeName(player.rawName), normalizeName(player.displayName)])].filter(
    (form) => form !== "",
  );
}

/**
 * Match Fantrax players to FPL players, club by club.
 *
 * Two passes per club, and the order is the point. Every exact match is assigned
 * first and its FPL player removed from the pool, and only then does fuzzy
 * matching run over what is left. Without that, a fuzzy near-miss can claim an
 * identity that an exact match was about to take — the sibling project had
 * Ipswich's "Harry Clarke" steal Jack Clarke's id this exact way.
 *
 * Players Fantrax gives no club for are matched against the whole league and
 * accepted only on a unique exact hit; anything less is a proposal.
 */
export function matchPlayers(
  fantraxPlayers: LeaguePlayer[],
  fplPlayers: FplCandidate[],
  aliases: Aliases = {},
  existing: Bridge = {},
): MatchResult {
  const matches: Record<string, MappedEntry> = {};
  const proposals: Proposal[] = [];

  const settled = settledIds(existing);
  const pending = fantraxPlayers.filter((player) => !settled.has(player.fantraxId));
  const byClub = new Map<string, FplCandidate[]>();
  for (const candidate of fplPlayers) {
    const club = byClub.get(candidate.clubCode) ?? [];
    club.push(candidate);
    byClub.set(candidate.clubCode, club);
  }

  // Seeded from the bridge, not empty: codes won on an earlier run are not up
  // for grabs on this one.
  const taken = claimedCodes(existing);

  const clubOf = (player: LeaguePlayer) =>
    player.clubCode === null ? null : toFplClubCode(player.clubCode);

  const poolFor = (player: LeaguePlayer): FplCandidate[] => {
    const club = clubOf(player);
    const pool = club === null ? fplPlayers : (byClub.get(club) ?? []);
    return pool.filter((candidate) => !taken.has(candidate.code));
  };

  const deferred: LeaguePlayer[] = [];

  // Pass A — exact and alias. Certain matches claim their identity before
  // anything approximate is allowed to compete for it.
  for (const player of pending) {
    const forms = fantraxForms(player);
    const alias = aliases[forms[0] ?? ""];
    const wanted = alias === undefined ? forms : [...forms, normalizeName(alias)];

    const hits = poolFor(player).filter((candidate) => {
      const variants = fplNameVariants(candidate);
      return wanted.some((form) => variants.includes(form));
    });

    if (hits.length === 1 && hits[0] !== undefined) {
      taken.add(hits[0].code);
      matches[player.fantraxId] = {
        fplCode: hits[0].code,
        matchedBy: alias === undefined ? "exact" : "alias",
        confidence: 100,
        };
      continue;
    }

    deferred.push(player);
  }

  // Pass B — fuzzy, over whoever is left unclaimed.
  for (const player of deferred) {
    const pool = poolFor(player);
    const forms = fantraxForms(player);

    if (pool.length === 0) {
      proposals.push(proposalFor(player, [], "no-candidates"));
      continue;
    }

    const scored = pool
      .map((candidate) => ({
        candidate,
        score: Math.max(...forms.map((form) => scoreAgainst(form, candidate))),
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const runnerUp = scored[1];
    if (best === undefined) {
      proposals.push(proposalFor(player, [], "no-candidates"));
      continue;
    }

    // A club-less player has the whole league to be confused with, so a fuzzy
    // win there is not evidence of anything.
    if (clubOf(player) === null || best.score < FUZZY_MIN_SCORE) {
      proposals.push(proposalFor(player, scored, "below-threshold"));
      continue;
    }

    if (runnerUp !== undefined && best.score - runnerUp.score < AMBIGUITY_MARGIN) {
      proposals.push(proposalFor(player, scored, "ambiguous"));
      continue;
    }

    if (!surnameAgrees(player.displayName, best.candidate)) {
      proposals.push(proposalFor(player, scored, "ambiguous"));
      continue;
    }

    taken.add(best.candidate.code);
    matches[player.fantraxId] = {
      fplCode: best.candidate.code,
      matchedBy: "fuzzy",
      confidence: best.score,
    };
  }

  return { matches, proposals };
}

function proposalFor(
  player: LeaguePlayer,
  scored: { candidate: FplCandidate; score: number }[],
  reason: Proposal["reason"],
): Proposal {
  return {
    fantraxId: player.fantraxId,
    fantraxName: player.displayName,
    clubCode: player.clubCode,
    positionHint: player.position,
    candidates: scored.slice(0, 3).map(({ candidate, score }) => ({
      fplCode: candidate.code,
      name: candidateName(candidate),
      score,
    })),
    reason,
  };
}
