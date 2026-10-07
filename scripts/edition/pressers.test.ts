import { describe, expect, it } from "vitest";
import { display } from "./pressers";

// Every row is a real 26/27 player, read out of the FPL snapshot on 18 Sep 2026.
// The column prints these names in prose, so a wrong one is a wrong fact.
describe("display", () => {
  it("adds the first name FPL leaves off", () => {
    expect(display({ name: "Burn", fullName: "Dan Burn" })).toBe("Dan Burn");
    expect(display({ name: "Osula", fullName: "William Osula" })).toBe("William Osula");
  });

  it("keeps a compound surname whole", () => {
    expect(display({ name: "Van den Berg", fullName: "Sepp van den Berg" })).toBe("Sepp van den Berg");
    expect(display({ name: "Kesler-Hayden", fullName: "Kaine Kesler-Hayden" })).toBe("Kaine Kesler-Hayden");
  });

  it("drops the initial FPL uses to tell a squad apart", () => {
    expect(display({ name: "N.Gonzalez", fullName: "Nico González Iglesias" })).toBe("Nico González");
    expect(display({ name: "J.Ramsey", fullName: "Jacob Ramsey" })).toBe("Jacob Ramsey");
  });

  it("finds a surname buried in a longer full name", () => {
    expect(display({ name: "Caicedo", fullName: "Moisés Caicedo Corozo" })).toBe("Moisés Caicedo");
    expect(display({ name: "Savona", fullName: "Nicolò Savona" })).toBe("Nicolò Savona");
  });

  it("leaves a man who goes by one name alone", () => {
    expect(display({ name: "Joelinton", fullName: "Joelinton Cássio Apolinário de Lira" })).toBe("Joelinton");
    expect(display({ name: "Murillo", fullName: "Murillo Costa dos Santos" })).toBe("Murillo");
    expect(display({ name: "Jair Cunha", fullName: "Jair Paula da Cunha Filho" })).toBe("Jair Cunha");
  });

  it("takes the token after the match when the match is his first name", () => {
    expect(display({ name: "O.Dango", fullName: "Dango Ouattara" })).toBe("Dango Ouattara");
  });

  it("falls back to the web name when there is nothing to add", () => {
    expect(display({ name: "Sels", fullName: "" })).toBe("Sels");
    expect(display({ name: "Sels" })).toBe("Sels");
  });
});
