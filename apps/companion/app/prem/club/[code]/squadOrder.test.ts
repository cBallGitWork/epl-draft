import { describe, expect, it } from "vitest";
import type { FootballPlayer } from "@epl/core";
import type { LeagueOpinion } from "../../leagueOpinions";
import { squadOrder } from "./squadOrder";

const man = (code: number, name: string, minutes: number): FootballPlayer =>
  ({ code, name, season: { minutes, starts: 0 } }) as unknown as FootballPlayer;

const defender = (fantraxId: string): LeagueOpinion => ({ fantraxId, positions: ["D"], status: "T", owner: null });

describe("a club's squad order", () => {
  it("puts the depth chart's first choice ahead of a man with more minutes, back from injury or not", () => {
    const back = man(1, "Saliba", 90);
    const cover = man(2, "Kiwior", 540);
    const league = new Map([[1, defender("a")], [2, defender("b")]]);
    const tiers = new Map([[1, 1], [2, 2]]);
    const order = [cover, back].sort(squadOrder(league, (code) => tiers.get(code)));
    expect(order.map((each) => each.name)).toEqual(["Saliba", "Kiwior"]);
  });
});
