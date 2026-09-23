import { describe, expect, it } from "vitest";
import { nextPoll } from "./cadence";

const rates = { live: 30, idle: 300 };

describe("nextPoll", () => {
  it("idles with no football ahead", () => {
    expect(nextPoll(null, 0, rates)).toBe(300);
  });

  it("wakes at a kickoff closer than the idle rate", () => {
    expect(nextPoll(45, 0, rates)).toBe(45);
    expect(nextPoll(100, 55, rates)).toBe(45);
  });

  it("idles when the kickoff is further than the idle rate", () => {
    expect(nextPoll(400, 0, rates)).toBe(300);
  });

  it("polls at the live rate once the kickoff has passed", () => {
    expect(nextPoll(0, 0, rates)).toBe(30);
    expect(nextPoll(45, 60, rates)).toBe(30);
  });
});
