import { describe, expect, it } from "vitest";
import type { LeaguePlayer } from "../league/types";
import {
  type FplCandidate,
  candidateName,
  fantraxForms,
  isExactHit,
  scoreAgainst,
  surnameAgrees,
} from "./candidates";
import { FUZZY_MIN_SCORE, tokenSetRatio } from "./similarity";

const candidate = (over: Partial<FplCandidate> = {}): FplCandidate => ({
  code: 223340, firstName: "Bukayo", secondName: "Saka", webName: "Saka", clubCode: "ARS", ...over,
});

// Real FPL codes and real spellings, both providers as they actually write them.
const saka = candidate();
const arsenalGabriel = candidate({
  code: 226597, firstName: "Gabriel", secondName: "dos Santos Magalhães", webName: "Gabriel",
});
const jesus = candidate({
  code: 205651, firstName: "Gabriel Fernando", secondName: "de Jesus", webName: "G.Jesus",
});
const bruno = candidate({
  code: 141746, firstName: "Bruno", secondName: "Borges Fernandes", webName: "B.Fernandes",
  clubCode: "MUN",
});
const raya = candidate({ code: 154561, firstName: "David", secondName: "Raya Martín", webName: "Raya" });
const rodri = candidate({
  code: 220566, firstName: "Rodrigo", secondName: "Hernández Cascante", webName: "Rodri",
  clubCode: "MCI",
});
const ballard = candidate({
  code: 223827, firstName: "Daniel", secondName: "Ballard", webName: "Ballard", clubCode: "SUN",
});
const odegaard = candidate({ code: 184029, firstName: "Martin", secondName: "Ødegaard", webName: "Ødegaard" });

const pooled = (rawName: string, displayName: string): LeaguePlayer => ({
  fantraxId: "05nns", rawName, displayName, clubCode: "SUN", position: "D", rotowireId: null,
});

describe("candidateName", () => {
  it("joins FPL's two halves, without a stray space when one is blank", () => {
    expect(candidateName(jesus)).toBe("Gabriel Fernando de Jesus");
    expect(candidateName(candidate({ firstName: "Rodri", secondName: "" }))).toBe("Rodri");
  });
});

describe("surnameAgrees", () => {
  it("rejects a namesake who only shares the given name", () => {
    // The score has nothing to say here: containment puts "Gabriel Jesus" at a
    // perfect 100 against Arsenal's bare "Gabriel". The guard is the only thing
    // standing between Jesus and a season of Magalhães's football.
    expect(scoreAgainst("Gabriel Jesus", arsenalGabriel)).toBe(100);
    expect(surnameAgrees("Gabriel Jesus", arsenalGabriel)).toBe(false);
    expect(surnameAgrees("Gabriel Jesus", jesus)).toBe(true);
  });

  it("accepts a candidate FPL publishes under a bare surname", () => {
    expect(surnameAgrees("Raya", raya)).toBe(true);
    // Rodri's surname appears in no part of the full name FPL gives, only in the
    // webName — so the guard has to consider both.
    expect(surnameAgrees("Rodri", rodri)).toBe(true);
  });

  it("reads the name in reading order, where the last token is the surname", () => {
    expect(surnameAgrees("Danny Ballard", ballard)).toBe(true);
  });

  it("rejects Fantrax's raw surname-first form, which callers must flip first", () => {
    // Pinned, not aspirational. In "Ballard, Danny" the last token is the GIVEN
    // name, so the guard asks whether FPL calls him Danny and refuses — every
    // diminutive fails this way. Loosening it to "any token agrees" would fix
    // this case and let "Jesus, Gabriel" walk off with Arsenal's Gabriel.
    expect(surnameAgrees("Ballard, Danny", ballard)).toBe(false);
  });

  it("refuses a name with nothing in it rather than agreeing with everything", () => {
    expect(surnameAgrees("", saka)).toBe(false);
  });
});

describe("scoreAgainst", () => {
  it("takes the best of every spelling FPL publishes", () => {
    // FPL's full name for Rodri is "Rodrigo Hernández Cascante". Compared whole
    // he is a stranger; only the webName is the name anyone else writes.
    expect(tokenSetRatio("Rodri", candidateName(rodri))).toBeLessThan(FUZZY_MIN_SCORE);
    expect(scoreAgainst("Rodri", rodri)).toBe(100);
  });

  it("survives FPL splitting a name where nobody else does", () => {
    // "Gabriel Fernando" / "de Jesus" is one footballer written by one provider
    // alone, so this pair has to clear the threshold on fuzz.
    expect(scoreAgainst("Gabriel Jesus", jesus)).toBeGreaterThanOrEqual(FUZZY_MIN_SCORE);
    expect(scoreAgainst("Bruno Fernandes", bruno)).toBe(100);
  });
});

describe("fantraxForms", () => {
  it("offers the raw surname-first form and the reading-order flip", () => {
    expect(fantraxForms(pooled("Ballard, Danny", "Danny Ballard"))).toEqual([
      "ballard danny",
      "danny ballard",
    ]);
  });

  it("collapses a name Fantrax already writes in reading order, and drops a blank one", () => {
    expect(fantraxForms(pooled("Gabriel Jesus", "Gabriel Jesus"))).toEqual(["gabriel jesus"]);
    expect(fantraxForms(pooled("", "Danny Ballard"))).toEqual(["danny ballard"]);
  });
});

describe("isExactHit", () => {
  it("hits on any of FPL's spellings, not only the full name", () => {
    expect(isExactHit(["saka bukayo", "bukayo saka"], saka)).toBe(true);
    expect(isExactHit(["rodri"], rodri)).toBe(true);
  });

  it("folds the stroke NFKD cannot decompose, keeping Ødegaard an exact hit", () => {
    // NFKD alone leaves "degaard". Without the fold table Fantrax's ASCII
    // "Odegaard, Martin" would miss FPL's spelling and fall to the fuzzy pass,
    // where a middle name or a namesake decides him instead.
    const forms = fantraxForms(pooled("Odegaard, Martin", "Martin Odegaard"));
    expect(isExactHit(forms, odegaard)).toBe(true);
  });

  it("misses when FPL splits the name somewhere nobody else does", () => {
    // Which is why Gabriel Jesus is one of the handful needing a curated alias.
    expect(isExactHit(["gabriel jesus"], jesus)).toBe(false);
  });
});
