import { describe, expect, it } from "vitest";
import { mapTeamBadges } from "./badges";
import type { RawStandingsPage } from "./standingsPage";
import standingsPage from "./__fixtures__/standingsPage.json";

// The badge half of a live anonymous read of the rehearsal league — 20 Aug 2026
// for these entries, plus a third team with no badge, which is the shape a
// manager who never picked one leaves behind. The table on the same fixture came
// off the 29 Aug read and belongs to `standings.test.ts`.

describe("mapTeamBadges", () => {
  const badges = mapTeamBadges(standingsPage as RawStandingsPage);

  it("keys each badge by the team that wears it", () => {
    expect(badges.map((badge) => badge.teamId)).toContain("8enbgqo5msgb375j");
  });

  it("asks for a size their host actually serves", () => {
    // `logoUrl512` hands over a `_256.webp` URL and 256 is the one size that
    // 404s — probed against all four badges on 20 Aug 2026. Shipping their value
    // verbatim is sixteen broken images.
    expect(badges.map((badge) => badge.url)).toEqual([
      "https://fantraximg.com/assets/images/icons/fantasyteams/soccer/gloves/blue_green2_128.webp",
      "https://fantraximg.com/assets/images/icons/fantasyteams/soccer/jerseys/lightblue_yellow_128.webp",
    ]);
  });

  it("passes through a path shaped like nothing we have seen", () => {
    const odd = "https://fantraximg.com/assets/images/icons/fantasyteams/soccer/custom.png";
    expect(mapTeamBadges({ fantasyTeamInfo: { t1: { logoUrl512: odd } } })[0]?.url).toBe(odd);
  });

  it("drops a team with no badge rather than carrying an empty URL", () => {
    expect(badges).toHaveLength(2);
    expect(badges.map((badge) => badge.teamId)).not.toContain("nobadge0000000000");
  });

  it("drops a badge served from anywhere we are not allow-listed to fetch", () => {
    // `logoUploaded` is a real field on their roster payload, so a custom crest
    // from some other path is a state this league can reach. `next/image`
    // throws on an unlisted URL and takes the whole page with it; an initial on
    // a disc costs one icon.
    const uploaded = { t1: { logoUrl512: "https://fantraximg.com/uploads/custom/t1_256.webp" } };
    expect(mapTeamBadges({ fantasyTeamInfo: uploaded })).toEqual([]);
  });

  it("answers nothing for a league nobody has joined", () => {
    expect(mapTeamBadges({ fantasyTeamInfo: {} })).toEqual([]);
    expect(mapTeamBadges({})).toEqual([]);
  });
});
