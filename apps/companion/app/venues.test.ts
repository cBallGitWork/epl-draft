import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import table from "../../../data/leagues/venues.json";
import { creditsIn, venueFor, type Venue, type VenueCredit } from "./venues";

describe("venueFor", () => {
  const venues = {
    home: { src: "/ground/venues/home.jpg", blur: "data:image/jpeg;base64,AA" },
    bare: { src: "/ground/venues/bare.jpg" },
  };

  it("hands back a listed team's picture, with its placeholder where it has one", () => {
    expect(venueFor(venues, "home")).toEqual({ src: "/ground/venues/home.jpg", blur: "data:image/jpeg;base64,AA" });
    expect(venueFor(venues, "bare")).toEqual({ src: "/ground/venues/bare.jpg" });
  });

  it("has none for a team the table does not list, so the desk's ground stands", () => {
    expect(venueFor(venues, "elsewhere")).toBeNull();
  });

  it("has none for a URL segment every object answers to", () => {
    for (const segment of ["constructor", "toString", "__proto__"]) expect(venueFor(venues, segment), segment).toBeNull();
  });
});

describe("creditsIn", () => {
  const credit = (source: string): VenueCredit => ({ place: "San Siro", title: "t", author: "a", licence: "CC0", licenceUrl: "u", source });

  it("credits a photograph two teams share once, and a team on the desk's own picture not at all", () => {
    const venues = {
      one: { src: "/ground/venues/a.jpg", credit: credit("a") },
      two: { src: "/ground/venues/a.jpg", credit: credit("a") },
      three: { src: "/ground/venues/b.jpg", credit: credit("b") },
      desk: { src: "/ground/crowd.jpg" },
    };
    expect(creditsIn(venues).map((c) => c.source)).toEqual(["a", "b"]);
  });
});

describe("the committed table", () => {
  const committed: Readonly<Record<string, Venue>> = table.venues;

  it("points every team at a picture served from public/", () => {
    for (const venue of Object.values(committed)) {
      expect(venue.src).toMatch(/^\/ground\/.+\.(jpg|jpeg|png|webp)$/);
      expect(existsSync(join(__dirname, "../public", venue.src)), venue.src).toBe(true);
    }
  });

  it("credits every team's own photograph in full, for /credits", () => {
    for (const venue of Object.values(committed)) {
      if (!venue.src.startsWith("/ground/venues/")) continue;
      expect(venue.credit, venue.src).toBeDefined();
      for (const field of Object.values(venue.credit ?? {})) expect(field, venue.src).not.toBe("");
    }
  });
});
