import { describe, expect, it } from "vitest";
import { teamCookieFor } from "./cdp.mjs";

// The shared client's pure parts; opening the module connects to nothing.

describe("teamCookieFor", () => {
  it("sets the team cookie on the host the instruments open, not always on localhost", () => {
    expect(teamCookieFor("signed", "http://localhost:3000").domain).toBe("localhost");
    expect(teamCookieFor("signed", "http://127.0.0.1:3000").domain).toBe("127.0.0.1");
    expect(teamCookieFor("signed", "https://epl-draft.vercel.app").domain).toBe("epl-draft.vercel.app");
  });

  it("covers every route", () => {
    expect(teamCookieFor("signed", "http://127.0.0.1:3000")).toEqual({
      name: "team",
      value: "signed",
      domain: "127.0.0.1",
      path: "/",
    });
  });
});
