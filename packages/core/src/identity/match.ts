import type { LeaguePlayer } from "../league/types";
import { type Bridge, type MappedEntry, claimedCodes, settledIds } from "./bridge";
import {
  type FplCandidate,
  candidateName,
  fantraxForms,
  isExactHit,
  scoreAgainst,
  surnameAgrees,
} from "./candidates";
import { toFplClubCode } from "./clubCodes";
import { normalizeName } from "./normalize";
import { AMBIGUITY_MARGIN, FUZZY_MIN_SCORE, nameAgreement } from "./similarity";

// Which FPL player a Fantrax player is, and when it is not sure, it says so: a wrong row gives a season to another man.

export type { FplCandidate };

/** A Fantrax player we could not settle, with what we considered, so a person can decide in one sitting. */
export interface Proposal {
  fantraxId: string;
  fantraxName: string;
  clubCode: string | null;
  /** Fantrax's position: shown to a person, never used to decide, since the commissioner can change it. */
  positionHint: string | null;
  candidates: { fplCode: number; name: string; score: number }[];
  reason: "no-candidates" | "below-threshold" | "ambiguous" | "identity-taken";
}

export interface MatchResult {
  matches: Record<string, MappedEntry>;
  proposals: Proposal[];
}

type Aliases = Record<string, string>;

/** Match Fantrax players to FPL players, club by club: every exact match claims its man before fuzzy matching runs
 *  over the rest. A man with no club is accepted only on a unique exact hit. */
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

  // Seeded from the bridge: codes won on an earlier run are not up for grabs.
  const taken = claimedCodes(existing);

  const clubOf = (player: LeaguePlayer) =>
    player.clubCode === null ? null : toFplClubCode(player.clubCode);

  const poolFor = (player: LeaguePlayer): FplCandidate[] => {
    const club = clubOf(player);
    const pool = club === null ? fplPlayers : (byClub.get(club) ?? []);
    return pool.filter((candidate) => !taken.has(candidate.code));
  };

  const deferred: LeaguePlayer[] = [];

  // Pass A: exact and alias, claiming their man before anything approximate competes.
  for (const player of pending) {
    const forms = fantraxForms(player);
    const alias = aliases[forms[0] ?? ""];
    const wanted = alias === undefined ? forms : [...forms, normalizeName(alias)];

    const hits = poolFor(player).filter((candidate) => isExactHit(wanted, candidate));

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

    // A club-less player has the whole league to be confused with, so a fuzzy win proves nothing.
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
      agreement: nameAgreement(player.displayName, candidateName(best.candidate)),
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
