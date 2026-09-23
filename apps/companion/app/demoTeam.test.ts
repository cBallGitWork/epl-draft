import { describe, expect, it } from "vitest";
import { lentTeam } from "./demoTeam";

const league = [{ teamId: "jtsmt5jxmtj31znh" }, { teamId: "8enbgqo5msgb375j" }];

describe("lentTeam", () => {
  it("lends the demo team when it is one of this league's", () => {
    expect(lentTeam(league, "jtsmt5jxmtj31znh")).toBe("jtsmt5jxmtj31znh");
  });

  it("lends nothing when the id names nobody here, as a test league's will after the swap", () => {
    expect(lentTeam([{ teamId: "real0000000000001" }], "jtsmt5jxmtj31znh")).toBeNull();
  });

  it("lends nothing when none is set", () => {
    expect(lentTeam(league, null)).toBeNull();
  });
});
