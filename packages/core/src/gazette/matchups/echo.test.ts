import { describe, expect, it } from "vitest";
import { headlineEcho } from "./echo";

describe("headlineEcho", () => {
  it("names the word a headline shares with a recent one, and passes a fresh one", () => {
    expect(headlineEcho("A clean break for test3", ["Groß clean sweeps the honours"])).toBe("clean");
    expect(headlineEcho("Haaland has the final word", ["Groß clean sweeps the honours", "test4 left holding the baby"])).toBeNull();
    expect(headlineEcho("test3 turn the tables", ["test4 left holding the baby"])).toBeNull();
  });
});
