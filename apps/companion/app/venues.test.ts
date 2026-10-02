import { describe, expect, it } from "vitest";
import table from "../../../data/leagues/venues.json";
import { venueFor } from "./venues";

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
});

describe("the committed table", () => {
  it("points every team at a picture served from public/", () => {
    for (const venue of Object.values(table.venues)) expect(venue.src).toMatch(/^\/ground\/.+\.(jpg|jpeg|png|webp)$/);
  });
});
