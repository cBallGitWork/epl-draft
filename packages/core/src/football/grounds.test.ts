import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { clubGround, clubColours } from "./clubs";
import { clubGroundPhoto, groundPhotoCredits } from "./grounds";

const PUBLIC_ROOT = new URL("../../../../apps/companion/public", import.meta.url);

describe("clubGroundPhoto", () => {
  it("answers null for a club nobody has hunted a picture for", () => {
    // A promoted club gets null, never another club's stadium.
    expect(clubGroundPhoto("WBA")).toBeNull();
  });

  it("is keyed on FPL's short name, like every other club table", () => {
    // Forest is "NFO" to FPL and "NOT" to Fantrax: a Fantrax label quietly gets nothing.
    expect(clubGroundPhoto("NFO")?.src).toBe("/ground/clubs/NFO.jpg");
    expect(clubGroundPhoto("NOT")).toBeNull();
  });
});

describe("groundPhotoCredits", () => {
  const credits = groundPhotoCredits();

  it("covers every club the palette does", () => {
    // The club tables share their twenty keys; a gap silently falls back to the desk's picture.
    for (const { shortName } of credits) {
      expect(clubGround(shortName), shortName).not.toBeNull();
      expect(clubColours(shortName).primary, shortName).not.toBe("#4b5563");
    }
    expect(credits).toHaveLength(20);
  });

  it("names an author and a licence for every one of them", () => {
    // CC BY and CC BY-SA require naming the photographer and linking the terms: a blank is a breach.
    for (const { shortName, photo } of credits) {
      expect(photo.author, shortName).not.toBe("");
      expect(photo.licence, shortName).not.toBe("");
      expect(photo.licenceUrl, shortName).toMatch(/^https?:\/\//);
      expect(photo.source, shortName).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    }
  });

  it("carries an inline placeholder for every one of them", () => {
    // Without one the ground blinks black between club screens; capped because it sits in every page's HTML.
    for (const { shortName, photo } of credits) {
      expect(photo.blur, shortName).toMatch(/^data:image\/jpeg;base64,/);
      expect(photo.blur.length, shortName).toBeLessThan(2000);
    }
  });

  it("only carries licences we are allowed to publish under", () => {
    // The one place the free-licence rule is enforced.
    for (const { shortName, photo } of credits) {
      expect(photo.licence, shortName).toMatch(/^(CC0|CC BY(-SA)? \d\.\d|Public domain)/);
    }
  });

  it("points at a file that is actually in the tree", () => {
    // A missing `public/` file is a silent 404 behind the page, never a build failure.
    for (const { shortName, photo } of credits) {
      expect(existsSync(fileURLToPath(new URL(`.${photo.src}`, `${PUBLIC_ROOT}/`))), shortName).toBe(
        true,
      );
    }
  });
});
