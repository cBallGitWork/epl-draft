import { describe, expect, it } from "vitest";
import type { RawPlEvent, RawPlFixture } from "./raw";
import { plMoments } from "./moments";
import { shotOf } from "./momentWords";
import liverpoolForest from "../__fixtures__/plTextstream.json";
import unitedIpswich from "../__fixtures__/plTextstreamAssists.json";
import spursVilla from "../__fixtures__/plTextstreamSpursVilla.json";
import liverpoolForestSheet from "../__fixtures__/plFixture.json";
import unitedIpswichSheet from "../__fixtures__/plFixtureAssists.json";
import spursVillaSheet from "../__fixtures__/plFixtureSpursVilla.json";

// Every string below is Opta's own, from the recorded matches.

const eventsOf = (stream: unknown): RawPlEvent[] => {
  const one = (Array.isArray(stream) ? stream[0] : stream) as { events: { content: RawPlEvent[] } };
  return one.events.content;
};
// The tests read Opta's person ids straight through; production maps them to FPL codes.
const same = (events: readonly RawPlEvent[]) => new Map(events.flatMap((e) => (e.playerIds ?? []).map((id) => [id, id])));
const momentsOf = (stream: unknown) => {
  const events = eventsOf(stream);
  return plMoments(events, same(events));
};

describe("shotOf", () => {
  it("reads a goal from the side of the box into the corner, off a pass", () => {
    expect(
      shotOf("Goal! Liverpool 0, Nottingham Forest 1. Dan Ndoye (Nottingham Forest) right footed shot from the left side of the box to the bottom right corner. Assisted by Morgan Gibbs-White."),
    ).toEqual({ foot: "right foot", from: "from inside the box", to: "low into the corner", supply: "pass", situation: null });
  });

  it("reads a cross from a corner and a header", () => {
    const shot = shotOf("Attempt missed. Dominic Solanke (Tottenham Hotspur) header from the centre of the box misses to the left. Assisted by Sávio with a cross following a corner.");
    expect(shot).toEqual({ foot: "header", from: "from inside the box", to: "wide", supply: "cross", situation: "corner" });
  });

  it("reads the woodwork, a direct free kick and a near miss", () => {
    expect(shotOf("Marcus Rashford (Manchester United) hits the left post with a right footed shot from outside the box from a direct free kick.")).toMatchObject({ to: "against the post", situation: "direct free kick", supply: null });
    expect(shotOf("Attempt missed. Sandro Tonali (Tottenham Hotspur) right footed shot from outside the box is close, but misses to the right.")).toMatchObject({ to: "just off target" });
    expect(shotOf("Attempt missed. X (Y) header from the left side of the box is just a bit too high.")).toMatchObject({ to: "just over" });
  });

  it("leaves a clause it does not know as null rather than guessing", () => {
    expect(shotOf("Something Opta has never written.")).toEqual({ foot: null, from: null, to: null, supply: null, situation: null });
  });
});

describe("plMoments on Tottenham 2-3 Aston Villa", () => {
  const moments = momentsOf(spursVilla);
  const of = (kind: string) => moments.filter((m) => m.kind === kind);

  it("keeps each goal's clock as printed, stoppage time included", () => {
    expect(of("goal").map((m) => m.minute)).toEqual(["45+4", "67", "79", "86", "90+8"]);
    expect(of("goal").map((m) => m.half)).toEqual([1, 2, 2, 2, 2]);
  });

  it("names scorer and maker by id, in Opta's order", () => {
    // Manzambi from Kamara, four minutes into first-half added time.
    expect(of("goal")[0].men).toEqual([304175, 25067]);
    expect(of("goal")[4].shot).toMatchObject({ foot: "header", from: "from inside the box" });
  });

  it("marks Porro's change as an injury and the half-time changes as not", () => {
    const changes = of("substitution");
    expect(changes[0]).toMatchObject({ minute: "19", injury: true, men: [117596, 32229] });
    expect(changes.filter((m) => m.injury)).toHaveLength(1);
  });

  it("carries the goal VAR ruled out and what it decided", () => {
    expect(of("ruled-out")).toMatchObject([{ minute: "60", men: [51364, 10443] }]);
    expect(of("var")).toMatchObject([{ minute: "60", varCall: "no goal" }]);
  });

  it("reads the added time announced for each half", () => {
    expect(of("added-time").map((m) => m.addedMinutes)).toEqual([5, 7]);
  });

  it("drops fouls, corners, offsides and delays, and the repeated full-time whistle", () => {
    expect(moments.some((m) => (m.kind as string) === "corner")).toBe(false);
    expect(of("full-time")).toHaveLength(1);
  });
});

describe("plMoments on the other recorded matches", () => {
  it("files an own goal confirmed by VAR as an own goal", () => {
    expect(momentsOf(unitedIpswich).filter((m) => m.kind === "own-goal")).toHaveLength(1);
  });

  it("files a penalty won, conceded and scored", () => {
    const kinds = momentsOf(liverpoolForest).map((m) => m.kind);
    expect(kinds).toEqual(expect.arrayContaining(["penalty-won", "penalty-conceded", "penalty-goal"]));
  });

  it("files a penalty that hit the post as a penalty missed", () => {
    const events: RawPlEvent[] = [
      { id: 1, type: "post", text: "Penalty missed! Still Brentford 3, Tottenham Hotspur 0. Igor Thiago (Brentford) hits the left post with a right footed shot.", time: { label: "55", secs: 3266 }, playerIds: [9] },
    ];
    expect(plMoments(events, new Map([[9, 9]]))[0]).toMatchObject({ kind: "penalty-missed", shot: { to: "against the post", situation: "penalty" } });
  });

  it("drops an event whose type it does not know", () => {
    const events: RawPlEvent[] = [{ id: 1, type: "something new", text: "x", time: { label: "10", secs: 600 } }];
    expect(plMoments(events, new Map())).toEqual([]);
  });
});

describe("the goals agree with the fixture detail", () => {
  const detailGoals = (sheet: unknown) =>
    ((sheet as RawPlFixture).events ?? []).filter((e) => ["G", "P", "O"].includes(e.type)).map((e) => Number.parseInt(e.clock?.label ?? "", 10));
  const streamGoals = (stream: unknown) =>
    momentsOf(stream).filter((m) => ["goal", "penalty-goal", "own-goal"].includes(m.kind)).map((m) => Number.parseInt(m.minute, 10));

  it.each([
    ["Liverpool 2-2 Forest", liverpoolForest, liverpoolForestSheet],
    ["Man Utd 5-2 Ipswich", unitedIpswich, unitedIpswichSheet],
    ["Tottenham 2-3 Villa", spursVilla, spursVillaSheet],
  ])("%s: the same goals at the same minutes", (_, stream, sheet) => {
    expect(streamGoals(stream)).toEqual(detailGoals(sheet));
  });
});
