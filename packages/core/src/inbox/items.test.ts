import { describe, expect, it } from "vitest";
import type { AvailabilityNote } from "../gazette/types";
import { availabilityNews } from "./doubts";
import { inboxItems, roundNews } from "./items";
import { dealNews } from "./messages";

describe("roundNews", () => {
  it("files the deadline and the reader's own result", () => {
    const items = roundNews({
      gameweek: 3,
      deadline: { gameweek: 3, locksAt: "2026-09-04T18:45:00Z" },
      yours: { opponent: "Dave's XI", points: 61.4, against: 58.9 },
    });
    expect(items.map((item) => item.headline)).toEqual([
      "Gameweek 3 lineups lock",
      "You beat Dave's XI in gameweek 3",
    ]);
  });

  it("says when lineups lock the way the commissioner would, in London time", () => {
    // Craig, 30 Sep 2026: "please write like a human". The time and day are the lock's own.
    const [lock] = roundNews({ gameweek: 6, deadline: { gameweek: 6, locksAt: "2026-10-10T11:15:00Z" }, yours: null });
    expect(lock.body).toBe(
      "Lineups lock at 12:15 on Saturday 10 October. Anyone left on your bench won't score, so get your team sorted before then.",
    );
  });

  it("goes red for a defeat and not for a win or a draw", () => {
    const result = (points: number, against: number) =>
      roundNews({ gameweek: 3, deadline: null, yours: { opponent: "D", points, against } })[0];
    expect(result(1, 2).urgent).toBe(true);
    expect(result(2, 1).urgent).toBe(false);
    expect(result(2, 2).urgent).toBe(false);
    expect(result(2, 2).headline).toBe("You drew with D in gameweek 3");
  });

  it("files nothing for a tie with no score", () => {
    // A round nobody has played is not a nil-nil. `points` is null exactly when
    // Fantrax gave no total (DESIGN §7).
    expect(
      roundNews({ gameweek: 3, deadline: null, yours: { opponent: "D", points: null, against: 0 } }),
    ).toEqual([]);
  });
});

describe("inboxItems", () => {
  const hurt = (playerName: string, newsAt: string | null): AvailabilityNote => ({
    playerName,
    fullName: `${playerName} Player`,
    newsAt,
    teamId: "t1",
    state: "injured",
    label: "Inj",
    out: true,
    news: "n",
    chance: 0,
  });

  const squads = { mine: "t1", opponent: "t2", name: () => "Mine" };

  it("puts dated items first, newest first, and undated ones after", () => {
    const items = inboxItems(
      // A doubt stamped BETWEEN the other two, which is the whole point of it
      // carrying a date: it sorts into the feed rather than arriving in a block
      // at the foot of it.
      availabilityNews([hurt("P", "2026-09-04T20:00:00Z")], 3, squads),
      roundNews({
        gameweek: 3,
        deadline: { gameweek: 3, locksAt: "2026-09-04T18:45:00Z" },
        yours: null,
      }),
      // Fantrax's own shape, which is what `Deal.processedAt` actually carries —
      // an ISO here made the test agree with a merge that could not order the
      // two. 9AM Eastern on the 5th is after the deadline's 14:45 Eastern on the
      // 4th, which is the comparison `whenKey` exists to make.
      dealNews(
        [
          {
            setId: "s1",
            kind: "claim",
            inbound: [{ playerName: "Alexander Isak", teamId: "t1", club: "LIV" }],
            outbound: [],
            processedAt: "Sat Sep 5, 2026, 9:00AM",
            period: 3,
          },
        ],
        () => "Craig's XI",
        null,
      ),
    );
    expect(items.map((item) => item.id)).toEqual([
      "deal:s1",
      "doubt:t1:P",
      "deadline:3",
    ]);
  });

  it("leaves the undated at the foot, in their builder's order", () => {
    // What is left undated is a doubt FPL published no stamp for, and the
    // round's own result — a fact about a finished tie rather than an event.
    const items = inboxItems(
      availabilityNews([hurt("Second", null), hurt("First", null)], 3, squads),
      roundNews({
        gameweek: 3,
        deadline: { gameweek: 3, locksAt: "2026-09-04T18:45:00Z" },
        yours: null,
      }),
    );
    expect(items.map((item) => item.id)).toEqual([
      "deadline:3",
      "doubt:t1:Second",
      "doubt:t1:First",
    ]);
  });

});
