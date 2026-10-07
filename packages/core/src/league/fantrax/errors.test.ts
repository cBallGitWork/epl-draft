import { describe, expect, it } from "vitest";
import { ProviderError } from "../../http/errors";
import { FantraxError, errorEnvelope } from "./errors";
import draftResults from "./__fixtures__/draftResults.json";
import errorNoLeague from "./__fixtures__/errorEnvelopeNoLeague.json";
import errorNoTeams from "./__fixtures__/errorEnvelope.json";
import leagueInfo from "./__fixtures__/leagueInfo.json";
import standings from "./__fixtures__/standings.json";

// Verbatim recordings of real fxea responses, both failures included, which arrived with HTTP 200.

describe("errorEnvelope", () => {
  it("detects the NO_TEAMS refusal our own league returns before the draft", () => {
    const error = errorEnvelope(errorNoTeams);
    expect(error?.code).toBe("NO_TEAMS");
    expect(error?.message).toContain("no teams");
  });

  it("detects a different code from the same envelope shape", () => {
    expect(errorEnvelope(errorNoLeague)?.code).toBe("NO_LEAGUE");
  });

  it("passes healthy bodies through, including the empty ones", () => {
    expect(errorEnvelope(leagueInfo)).toBeNull();
    expect(errorEnvelope(draftResults)).toBeNull();
    // An empty league is not a failed league: standings is `[]` until the draft.
    expect(errorEnvelope(standings)).toBeNull();
  });

  it("ignores an `error` that is not an envelope", () => {
    // Only an object carrying a string `code` counts, so an unrelated `error` field is no refusal.
    expect(errorEnvelope({ error: "not an object" })).toBeNull();
    expect(errorEnvelope({ error: {} })).toBeNull();
    expect(errorEnvelope({ error: { message: "no code" } })).toBeNull();
    expect(errorEnvelope(null)).toBeNull();
    expect(errorEnvelope([])).toBeNull();
  });
});

describe("FantraxError", () => {
  it("names the method and code, so a failed capture says which read broke", () => {
    const error = new FantraxError("getTeamRosters", "NO_TEAMS", "There are currently no teams");
    expect(error.method).toBe("getTeamRosters");
    expect(error.code).toBe("NO_TEAMS");
    expect(error.message).toContain("getTeamRosters");
    expect(error.message).toContain("NO_TEAMS");
    expect(error).toBeInstanceOf(Error);
  });

  it("is a provider error, with the message it has always had", () => {
    const error = new FantraxError("getTeamRosters", "NO_TEAMS", "There are currently no teams");
    expect(error).toBeInstanceOf(ProviderError);
    expect(error.message).toBe("Fantrax getTeamRosters: NO_TEAMS — There are currently no teams");
  });
});
