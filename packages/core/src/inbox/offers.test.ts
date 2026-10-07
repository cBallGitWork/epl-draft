import { describe, expect, it } from "vitest";
import type { TradeProposal } from "../league/proposals";
import { offerNews } from "./offers";

const NAMES: Record<string, string> = { t1: "The Raccoons", t2: "GlengarryHearts" };
const name = (id: string) => NAMES[id] ?? null;

const proposal: TradeProposal = {
  setId: "p1",
  proposedAt: "Wed Oct 7, 2026, 12:29PM",
  teamIds: ["t2", "t1"],
  moves: [
    { fantraxId: "saka", playerName: "Bukayo Saka", club: "ARS", clubName: "Arsenal", fromTeamId: "t2", toTeamId: "t1" },
    { fantraxId: "haaland", playerName: "Erling Haaland", club: "MCI", clubName: "Manchester City", fromTeamId: "t1", toTeamId: "t2" },
  ],
};

describe("offerNews", () => {
  it("writes the deal to a manager in it, as what he would get and give", () => {
    const [item] = offerNews([proposal], { name, mine: "t1", zone: "Europe/London" });
    expect(item.headline).toBe("A deal with GlengarryHearts is on the table");
    expect(item.body).toBe(
      "You'd get Arsenal's Bukayo Saka and give up Erling Haaland. It's waiting for an answer on Fantrax.",
    );
    expect(item.teamId).toBe("t2");
    expect(item.id).toBe("offer:p1");
    // The session's log stamps in its own zone, here London's.
    expect(item.at).toBe("2026-10-07T11:29:00.000Z");
  });

  it("reads true from the other side of the same deal", () => {
    const [item] = offerNews([proposal], { name, mine: "t2", zone: "Europe/London" });
    expect(item.headline).toBe("A deal with The Raccoons is on the table");
    expect(item.body).toBe(
      "You'd get Manchester City's Erling Haaland and give up Bukayo Saka. It's waiting for an answer on Fantrax.",
    );
  });

  // Fantrax keeps a proposal between its two managers; the commissioner's read must not widen that.
  it("tells nobody outside the deal, and nobody signed out", () => {
    expect(offerNews([proposal], { name, mine: "t3", zone: "Europe/London" })).toEqual([]);
    expect(offerNews([proposal], { name, mine: null, zone: "Europe/London" })).toEqual([]);
  });

  it("says only what the deal names when one side gives nothing named", () => {
    const [item] = offerNews([{ ...proposal, moves: [proposal.moves[0]] }], { name, mine: "t1", zone: "Europe/London" });
    expect(item.body).toBe("You'd get Arsenal's Bukayo Saka. It's waiting for an answer on Fantrax.");
  });
});
