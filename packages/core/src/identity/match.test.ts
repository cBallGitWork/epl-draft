import { describe, expect, it } from "vitest";
import type { LeaguePlayer } from "../league/types";
import { matchPlayers, type FplCandidate } from "./match";

function fantrax(fantraxId: string, rawName: string, clubCode: string | null): LeaguePlayer {
  const comma = rawName.indexOf(", ");
  const displayName =
    comma === -1 ? rawName : `${rawName.slice(comma + 2)} ${rawName.slice(0, comma)}`;
  return { fantraxId, rawName, displayName, clubCode, position: "M", rotowireId: null };
}

function fpl(
  code: number,
  firstName: string,
  secondName: string,
  webName: string,
  clubCode: string,
): FplCandidate {
  return { code, firstName, secondName, webName, clubCode };
}

describe("matchPlayers", () => {
  it("matches the surname-first form Fantrax uses", () => {
    const result = matchPlayers(
      [fantrax("a1", "Saka, Bukayo", "ARS")],
      [fpl(1, "Bukayo", "Saka", "Saka", "ARS")],
    );
    expect(result.matches.a1).toMatchObject({ fplCode: 1, matchedBy: "exact", confidence: 100 });
    expect(result.proposals).toEqual([]);
  });

  it("translates the two club codes FPL spells differently", () => {
    // Fantrax says NOT and BRF; FPL says NFO and BRE. Untranslated, these two
    // find an empty candidate pool.
    const result = matchPlayers(
      [fantrax("a1", "Wood, Chris", "NOT"), fantrax("a2", "Wissa, Yoane", "BRF")],
      [fpl(1, "Chris", "Wood", "Wood", "NFO"), fpl(2, "Yoane", "Wissa", "Wissa", "BRE")],
    );
    expect(result.matches.a1?.fplCode).toBe(1);
    expect(result.matches.a2?.fplCode).toBe(2);
  });

  it("refuses to let a shared given name claim another player", () => {
    // The case this whole guard exists for. token_set_ratio scores "Gabriel"
    // against "Gabriel Jesus" at a perfect 100, so without a surname check the
    // wrong Arsenal player gets a season of someone else's football.
    const result = matchPlayers(
      [fantrax("a1", "Gabriel Jesus", "ARS")],
      [fpl(1, "Gabriel", "dos Santos Magalhães", "Gabriel", "ARS")],
    );
    expect(result.matches.a1).toBeUndefined();
    expect(result.proposals[0]?.fantraxId).toBe("a1");
  });

  it("guards on the surname, not on whichever token comes last in Fantrax's form", () => {
    // Fantrax writes surname-first, so the raw form's last token is the GIVEN
    // name. Guarding on that asks whether FPL's player is called "Danny" and
    // rejects Daniel Ballard for saying Daniel. Every diminutive was failing
    // this way — Josh/Joshua, Ben/Benjamin — while looking like a safe refusal.
    const result = matchPlayers(
      [fantrax("a1", "Ballard, Danny", "SUN")],
      [fpl(1, "Daniel", "Ballard", "Ballard", "SUN")],
    );
    expect(result.matches.a1).toMatchObject({ fplCode: 1, matchedBy: "fuzzy" });
  });

  it("still refuses a surname-first name whose given name matches the wrong player", () => {
    // The guard must not be loosened into "any token agrees": were Fantrax to
    // write "Jesus, Gabriel", the given name alone would hand him Arsenal's
    // Gabriel. Reading order is what makes the last token a surname.
    const result = matchPlayers(
      [fantrax("a1", "Jesus, Gabriel", "ARS")],
      [fpl(1, "Gabriel", "dos Santos Magalhães", "Gabriel", "ARS")],
    );
    expect(result.matches.a1).toBeUndefined();
  });

  it("matches across the apostrophe both providers spell differently", () => {
    const result = matchPlayers(
      [fantrax("a1", "OBrien, Jake", "EVE")],
      [fpl(1, "Jake", "O'Brien", "O'Brien", "EVE")],
    );
    expect(result.matches.a1?.fplCode).toBe(1);
  });

  it("still matches a bare FPL surname when the surname agrees", () => {
    const result = matchPlayers(
      [fantrax("a1", "Raya, David", "ARS")],
      [fpl(1, "David", "Raya Martín", "Raya", "ARS")],
    );
    expect(result.matches.a1?.fplCode).toBe(1);
  });

  it("assigns every exact match before fuzzy matching competes for identities", () => {
    // Two Clarkes at one club. If the fuzzy pass ran first, Harry could take
    // Jack's code and Jack would then be unmatchable.
    const result = matchPlayers(
      [fantrax("a1", "Clarke, Harry", "IPS"), fantrax("a2", "Clarke, Jack", "IPS")],
      [fpl(1, "Jack", "Clarke", "J.Clarke", "IPS"), fpl(2, "Harry", "Clarke", "H.Clarke", "IPS")],
    );
    expect(result.matches.a1?.fplCode).toBe(2);
    expect(result.matches.a2?.fplCode).toBe(1);
  });

  it("proposes rather than guesses when two candidates are close", () => {
    const result = matchPlayers(
      [fantrax("a1", "Silva, Bernardo", "MCI")],
      [
        fpl(1, "Bernardo", "Silva Costa", "Silva", "MCI"),
        fpl(2, "Bernardo", "Silva Souza", "B.Silva", "MCI"),
      ],
    );
    expect(result.matches.a1).toBeUndefined();
    expect(result.proposals[0]?.candidates.length).toBeGreaterThan(1);
  });

  it("reports a player FPL has never heard of instead of forcing a match", () => {
    // Fantrax carries academy players FPL does not list. Unmapped is the correct
    // answer, and the proposal carries what was considered.
    const result = matchPlayers(
      [fantrax("a1", "Copley, Louie", "ARS")],
      [fpl(1, "Bukayo", "Saka", "Saka", "ARS")],
    );
    expect(result.matches.a1).toBeUndefined();
    expect(result.proposals[0]?.reason).toBe("below-threshold");
  });

  it("will not settle a player Fantrax gives no club for", () => {
    const result = matchPlayers(
      [fantrax("a1", "Saka, Bukayo", null)],
      [fpl(1, "Bukayo", "Saka", "Saka", "ARS"), fpl(2, "Bukayo", "Sakho", "Sakho", "CHE")],
    );
    // The exact hit is unique across the league, so it stands.
    expect(result.matches.a1?.fplCode).toBe(1);
  });

  it("proposes a club-less player who only matches fuzzily", () => {
    const result = matchPlayers(
      [fantrax("a1", "Szobozslai, Dominik", null)],
      [fpl(1, "Dominik", "Szoboszlai", "Szoboszlai", "LIV")],
    );
    expect(result.matches.a1).toBeUndefined();
    expect(result.proposals[0]?.reason).toBe("below-threshold");
  });

  it("skips ids the bridge has already settled", () => {
    const result = matchPlayers(
      [fantrax("a1", "Saka, Bukayo", "ARS")],
      [fpl(1, "Bukayo", "Saka", "Saka", "ARS")],
      {},
      { a1: { fplCode: 1, matchedBy: "exact", confidence: 100 } },
    );
    expect(result.matches).toEqual({});
    expect(result.proposals).toEqual([]);
  });

  it("will not re-award an FPL player already claimed on an earlier run", () => {
    // The cross-run version of the Clarke problem. Jack is settled and skipped,
    // so nothing in THIS run opposes Harry — and he takes Jack's code unless the
    // matcher is told it is spoken for. One footballer, two claimants.
    const result = matchPlayers(
      [fantrax("a1", "Clarke, Harry", "IPS")],
      [fpl(1, "Jack", "Clarke", "J.Clarke", "IPS")],
      {},
      { other: { fplCode: 1, matchedBy: "exact", confidence: 100 } },
    );
    expect(result.matches.a1).toBeUndefined();
    expect(result.proposals[0]?.reason).toBe("no-candidates");
  });

  it("frees a code held only by an unmapped entry", () => {
    // Unmapped players hold no code, so nothing should be reserved on their
    // behalf.
    const result = matchPlayers(
      [fantrax("a1", "Saka, Bukayo", "ARS")],
      [fpl(1, "Bukayo", "Saka", "Saka", "ARS")],
      {},
      { other: { status: "unmapped", unmappedBy: "manual", auditedAt: "2026-08-05" } },
    );
    expect(result.matches.a1?.fplCode).toBe(1);
  });

  it("uses a curated alias to settle a name that cannot be derived", () => {
    const result = matchPlayers(
      [fantrax("a1", "Igor Thiago", "BRF")],
      [fpl(1, "Thiago", "Igor Silva", "Thiago", "BRE")],
      { "igor thiago": "Thiago Igor Silva" },
    );
    expect(result.matches.a1).toMatchObject({ fplCode: 1, matchedBy: "alias" });
  });

  it("carries the position only as a hint on proposals", () => {
    const result = matchPlayers(
      [fantrax("a1", "Copley, Louie", "ARS")],
      [fpl(1, "Bukayo", "Saka", "Saka", "ARS")],
    );
    expect(result.proposals[0]?.positionHint).toBe("M");
  });
});
