import { describe, expect, it } from "vitest";
import { cookieTeamOf, cookieValue, hmac } from "./sessionCookie";

const SECRET = "a-session-secret";

describe("the team cookie", () => {
  it("names the team it was signed for", async () => {
    expect(await cookieTeamOf(await cookieValue("team0001", SECRET), SECRET)).toBe("team0001");
  });

  it("refuses the unversioned cookie signed with the secret itself", async () => {
    const old = `team0001.${await hmac("team0001", SECRET)}`;
    expect(await cookieTeamOf(old, SECRET)).toBeNull();
  });

  it("never signs with the key the code hashes use", async () => {
    const value = await cookieValue("team0001", SECRET);
    expect(value.endsWith(await hmac("team0001", SECRET))).toBe(false);
  });

  it("refuses one team's signature on another team's id", async () => {
    const signature = (await cookieValue("team0001", SECRET)).split(".").at(-1);
    expect(await cookieTeamOf(`v1.team0002.${signature}`, SECRET)).toBeNull();
  });

  it("refuses a cookie signed under another secret", async () => {
    expect(await cookieTeamOf(await cookieValue("team0001", "another"), SECRET)).toBeNull();
  });

  it("refuses what is not a cookie of ours", async () => {
    for (const raw of ["", "v1", "v1..", "v1.team0001", "v1.team0001.sig.extra"]) {
      expect(await cookieTeamOf(raw, SECRET)).toBeNull();
    }
  });
});
