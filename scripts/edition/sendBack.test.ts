import { describe, expect, it, vi } from "vitest";
import type { Fault } from "@epl/core";

const columns: Record<string, unknown>[] = [];
const written = vi.fn(async (_voice: string, _brief: string) => columns.shift() ?? {});
vi.mock("./newsroom", async (actual) => ({ ...(await actual<typeof import("./newsroom")>()), writeColumn: (voice: string, brief: string) => written(voice, brief) }));
const { faultSummary, sendBackOnce, serious } = await import("./sendBack");

const fault = (check: string, severity: Fault["severity"] = "hard"): Fault => ({ section: "column", check, severity, evidence: `${check}!` });

describe("serious and faultSummary", () => {
  it("keep the faults worth a rewrite and name six of them", () => {
    expect(serious([fault("a"), fault("b", "warn"), fault("c", "send-back")]).map((f) => f.check)).toEqual(["a", "c"]);
    expect(faultSummary(["a", "b", "c", "d", "e", "f", "g"].map((check) => fault(check)))).toBe("a (a!), b (b!), c (c!), d (d!), e (e!), f (f!)");
  });
});

describe("sendBackOnce", () => {
  const read = (raw: Record<string, unknown>) => ({ faults: raw.ok === true ? [] : [fault("a figure the facts do not give")], raw });

  it("files the first column when nothing serious is wrong with it", async () => {
    columns.push({ ok: true });
    const said: string[] = [];
    const attempts = await sendBackOnce({ desk: "sheets", voice: "V", brief: "B", read, sendBack: () => "again" }, (line) => said.push(line));
    expect(attempts).toHaveLength(1);
    expect(said).toEqual([]);
  });

  it("sends it back once, saying so, with the faults appended to the brief", async () => {
    columns.push({ ok: false }, { ok: true });
    const said: string[] = [];
    const attempts = await sendBackOnce({ desk: "lawro", voice: "V", brief: "B", read, sendBack: (faults) => `fix ${faults.length}` }, (line) => said.push(line));
    expect(attempts.map((attempt) => attempt.faults.length)).toEqual([1, 0]);
    expect(said).toEqual(["  ↩ lawro: 1 faults, sent back once: a figure the facts do not give (a figure the facts do not give!)"]);
    expect(written).toHaveBeenLastCalledWith("V", "B\n\nfix 1");
  });
});
