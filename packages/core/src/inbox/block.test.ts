import { describe, expect, it } from "vitest";
import type { BlockPlayer, TradeBlock } from "../league/types";
import { blockNews } from "./block";

const NAMES: Record<string, string> = { t1: "The Raccoons", t2: "GlengarryHearts" };
const name = (id: string) => NAMES[id] ?? null;
const HOLDERS: Record<string, string> = { saka: "t2" };
const holder = (id: string) => HOLDERS[id] ?? null;

const haaland: BlockPlayer = {
  fantraxId: "haaland",
  playerName: "Erling Haaland",
  position: "F",
  club: "MCI",
  clubName: "Manchester City",
};
const saka: BlockPlayer = { fantraxId: "saka", playerName: "Bukayo Saka", position: "M,F", club: "ARS", clubName: "Arsenal" };

const empty: TradeBlock = {
  teamId: "t1",
  updatedAt: "2026-10-07T16:42:36.251Z",
  offered: [],
  wanted: [],
  positionsOffered: [],
  positionsWanted: [],
  comment: null,
};

describe("blockNews", () => {
  it("tells every manager a man has been transfer-listed", () => {
    const [item] = blockNews([{ ...empty, offered: [haaland] }], { name, mine: "t2", holder });
    expect(item.headline).toBe("The Raccoons transfer-list Erling Haaland (MCI)");
    expect(item.body).toBe("Manchester City's Erling Haaland has been put on the transfer list.");
    expect(item.from).toBe("The transfer desk");
    expect(item.teamId).toBe("t1");
    expect(item.at).toBe("2026-10-07T16:42:36.251Z");
  });

  it("says a wanted position is a team in the market", () => {
    const [item] = blockNews([{ ...empty, positionsWanted: ["Defender", "Goalkeeper"] }], { name, mine: null, holder });
    expect(item.headline).toBe("The Raccoons are in the market for a defender and a goalkeeper");
    expect(item.body).toBe("They're in the market for a defender and a goalkeeper.");
  });

  it("writes your own block to you as yours", () => {
    const [item] = blockNews([{ ...empty, offered: [haaland], positionsWanted: ["Midfielder"], comment: "Offers" }], {
      name,
      mine: "t1",
      holder,
    });
    expect(item.headline).toBe("You transfer-list Erling Haaland (MCI)");
    expect(item.body).toBe(
      "Manchester City's Erling Haaland has been put on the transfer list. You're in the market for a midfielder. Your note: \"Offers\"",
    );
  });

  it("tells you when a rival is interested in your man", () => {
    const [item] = blockNews([{ ...empty, wanted: [saka] }], { name, mine: "t2", holder });
    expect(item.headline).toBe("The Raccoons are interested in Bukayo Saka (ARS)");
    expect(item.body).toBe("They're interested in your Bukayo Saka.");
    // Anyone else reads whose club he plays for.
    expect(blockNews([{ ...empty, wanted: [saka] }], { name, mine: null, holder })[0].body).toBe(
      "They're interested in Arsenal's Bukayo Saka.",
    );
  });

  it("names two men in the headline and every man in the letter", () => {
    const palmer = { ...haaland, fantraxId: "palmer", playerName: "Cole Palmer", club: "CHE", clubName: "Chelsea" };
    const rice = { ...haaland, fantraxId: "rice", playerName: "Declan Rice", club: "ARS", clubName: "Arsenal" };
    const [item] = blockNews([{ ...empty, offered: [haaland, palmer, rice] }], { name, mine: null, holder });
    expect(item.headline).toBe("The Raccoons transfer-list Erling Haaland (MCI) and Cole Palmer (CHE)");
    expect(item.body).toBe(
      "Manchester City's Erling Haaland, Chelsea's Cole Palmer and Arsenal's Declan Rice have been put on the transfer list.",
    );
  });

  it("is new mail each time the block is saved", () => {
    const first = blockNews([{ ...empty, offered: [haaland] }], { name, mine: null, holder })[0];
    const again = blockNews([{ ...empty, offered: [haaland], updatedAt: "2026-10-08T09:00:00.000Z" }], {
      name,
      mine: null,
      holder,
    })[0];
    expect(again.id).not.toBe(first.id);
  });

  it("offers a position up as listening to offers", () => {
    const [item] = blockNews([{ ...empty, positionsOffered: ["Forward"] }], { name, mine: null, holder });
    expect(item.headline).toBe("The Raccoons will listen to offers for a forward");
  });
});
