import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { clubGround, clubColours } from "./clubs";
import { clubGroundPhoto, groundPhotoCredits } from "./grounds";

const PUBLIC_ROOT = new URL("../../../../apps/companion/public", import.meta.url);

describe("clubGroundPhoto", () => {
  it("answers null for a club nobody has hunted a picture for", () => {
    // Three clubs come up every May and reach the API before the hunt does. The
    // caller falls back to the desk's own ground; what it must never do is put
    // some other club's stadium under this club's name.
    expect(clubGroundPhoto("WBA")).toBeNull();
  });

  it("is keyed on FPL's short name, like every other club table", () => {
    // Forest is "NFO" to FPL and "NOT" to Fantrax, and the same trap as
    // `clubColours`: a league-layer label quietly gets nothing rather than
    // throwing, which is why the two layers never join on short name.
    expect(clubGroundPhoto("NFO")?.src).toBe("/ground/clubs/NFO.jpg");
    expect(clubGroundPhoto("NOT")).toBeNull();
  });
});

describe("groundPhotoCredits", () => {
  const credits = groundPhotoCredits();

  it("covers every club the palette does", () => {
    // The three club tables in this folder share their twenty keys exactly, and
    // a ground missing from one of them is a club whose screen silently falls
    // back to the desk's picture. Checked against the colours because that is
    // the table a promoted club gets added to first.
    for (const { shortName } of credits) {
      expect(clubGround(shortName), shortName).not.toBeNull();
      expect(clubColours(shortName).primary, shortName).not.toBe("#4b5563");
    }
    expect(credits).toHaveLength(20);
  });

  it("names an author and a licence for every one of them", () => {
    // Not tidiness: CC BY and CC BY-SA both require naming the photographer and
    // linking the terms, so a blank here is a licence breach rather than a gap
    // in a page. `/credits` prints exactly these fields.
    for (const { shortName, photo } of credits) {
      expect(photo.author, shortName).not.toBe("");
      expect(photo.licence, shortName).not.toBe("");
      expect(photo.licenceUrl, shortName).toMatch(/^https?:\/\//);
      expect(photo.source, shortName).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    }
  });

  it("carries an inline placeholder for every one of them", () => {
    // A ground with no placeholder is the black frame between two club screens
    // coming back (Craig, 11 Sep 2026), and it comes back silently: the picture
    // still arrives, just a beat after the page. Bounded above as well as below
    // because these sit in the HTML of every club and match page — a full-size
    // data URI pasted in here would cost every one of them.
    for (const { shortName, photo } of credits) {
      expect(photo.blur, shortName).toMatch(/^data:image\/jpeg;base64,/);
      expect(photo.blur.length, shortName).toBeLessThan(2000);
    }
  });

  it("only carries licences we are allowed to publish under", () => {
    // The hunt filtered on this and the filter is not in the tree; this is where
    // the rule actually lives. A non-free picture is one nobody would notice
    // until somebody else did.
    for (const { shortName, photo } of credits) {
      expect(photo.licence, shortName).toMatch(/^(CC0|CC BY(-SA)? \d\.\d|Public domain)/);
    }
  });

  it("points at a file that is actually in the tree", () => {
    // `next/image` on a missing `public/` path is a 404 behind a page rather
    // than a build failure, and this ground is `fixed` at `-z-10` where nobody
    // would see the hole. So the file's presence is asserted here.
    for (const { shortName, photo } of credits) {
      expect(existsSync(fileURLToPath(new URL(`.${photo.src}`, `${PUBLIC_ROOT}/`))), shortName).toBe(
        true,
      );
    }
  });
});
