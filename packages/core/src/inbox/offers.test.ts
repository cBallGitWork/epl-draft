import { describe, expect, it } from "vitest";
import type { TradeProposal } from "../league/proposals";
import { offerNews } from "./offers";

const NAMES: Record<string, string> = { t1: "The Raccoons", t2: "GlengarryHearts" };
const name = (id: string) => NAMES[id] ?? null;
const NOW = "2026-10-07T18:00:00.000Z";

// GlengarryHearts offering Saka for Haaland, stamped as the pending page prints it.
const proposal: TradeProposal = {
  setId: "p1",
  creatorTeamId: "t2",
  proposedAt: "Oct 7, 12:29 PM BST",
  teamIds: ["t2", "t1"],
  moves: [
    { fantraxId: "saka", playerName: "Bukayo Saka", club: "ARS", clubName: "Arsenal", fromTeamId: "t2", toTeamId: "t1" },
    { fantraxId: "haaland", playerName: "Erling Haaland", club: "MCI", clubName: "Manchester City", fromTeamId: "t1", toTeamId: "t2" },
  ],
};

describe("offerNews", () => {
  it("writes an offer to the manager it waits on, urgently, as what he would get and give", () => {
    const [item] = offerNews([proposal], { name, mine: "t1", now: NOW });
    expect(item.headline).toBe("An offer from GlengarryHearts");
    expect(item.body).toBe(
      "You'd get Arsenal's Bukayo Saka and give up Erling Haaland. It's waiting for your answer on Fantrax.",
    );
    expect(item.urgent).toBe(true);
    expect(item.teamId).toBe("t2");
    expect(item.id).toBe("offer:p1");
    expect(item.at).toBe("2026-10-07T11:29:00.000Z");
  });

  it("writes the same deal to the manager who made it, as his offer", () => {
    const [item] = offerNews([proposal], { name, mine: "t2", now: NOW });
    expect(item.headline).toBe("Your offer to The Raccoons");
    expect(item.body).toBe(
      "You'd get Manchester City's Erling Haaland and give up Bukayo Saka. It's waiting for their answer on Fantrax.",
    );
    expect(item.urgent).toBe(false);
  });

  it("stays true for either side when Fantrax does not say who made it", () => {
    const [item] = offerNews([{ ...proposal, creatorTeamId: null }], { name, mine: "t1", now: NOW });
    expect(item.headline).toBe("A deal with GlengarryHearts is on the table");
    expect(item.body).toBe(
      "You'd get Arsenal's Bukayo Saka and give up Erling Haaland. It's waiting for an answer on Fantrax.",
    );
  });

  // Fantrax keeps a proposal between its two managers; the commissioner's read must not widen that.
  it("tells nobody outside the deal, and nobody signed out", () => {
    expect(offerNews([proposal], { name, mine: "t3", now: NOW })).toEqual([]);
    expect(offerNews([proposal], { name, mine: null, now: NOW })).toEqual([]);
  });

  it("keeps two lists apart when the first already has an 'and'", () => {
    const two: TradeProposal = {
      ...proposal,
      moves: [
        ...proposal.moves,
        { fantraxId: "rice", playerName: "Declan Rice", club: "ARS", clubName: "Arsenal", fromTeamId: "t2", toTeamId: "t1" },
      ],
    };
    const [item] = offerNews([two], { name, mine: "t1", now: NOW });
    expect(item.body).toBe(
      "You'd get Arsenal's Bukayo Saka and Arsenal's Declan Rice, and give up Erling Haaland. It's waiting for your answer on Fantrax.",
    );
  });

  it("says only what the deal names when one side gives nothing named", () => {
    const [item] = offerNews([{ ...proposal, moves: [proposal.moves[0]] }], { name, mine: "t1", now: NOW });
    expect(item.body).toBe("You'd get Arsenal's Bukayo Saka. It's waiting for your answer on Fantrax.");
  });
});
