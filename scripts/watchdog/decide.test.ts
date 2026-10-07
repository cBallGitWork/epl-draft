import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MAC_RULES, type Run, WATCHDOG_RULE, WORKFLOW_RULES, type WorkflowRule, findings, standAt } from "./decide";

// The watchdog's verdict at chosen instants, over runs written by hand.

const HOUR = 3_600_000;

function run(createdAt: string, conclusion = "success", displayTitle = "a run"): Run {
  return { displayTitle, status: "completed", conclusion, createdAt };
}

function check(rules: readonly WorkflowRule[], listed: Record<string, Run[]>, now: string) {
  return findings(rules, [], new Map(Object.entries(listed)), Date.parse(now));
}

function mac(reports: Run[], now: string) {
  return findings([], MAC_RULES, new Map([["alert.yml", reports]]), Date.parse(now));
}

const DAILY: WorkflowRule = { workflow: "capture.yml", within: 30 };
const RATINGS = WORKFLOW_RULES.find((rule) => rule.workflow === "ratings.yml")!;

describe("a workflow owed a success within hours", () => {
  it("is quiet when the last success is inside the window", () => {
    expect(check([DAILY], { "capture.yml": [run("2026-10-07T05:20:00Z")] }, "2026-10-08T11:00:00Z")).toEqual([]);
  });

  it("files under the workflow's own source once the window has passed", () => {
    const found = check([DAILY], { "capture.yml": [run("2026-10-07T05:20:00Z")] }, "2026-10-08T11:30:00Z");
    expect(found).toEqual([{ source: "capture", message: expect.stringContaining("last succeeded at 2026-10-07 05:20 UTC") }]);
  });

  it("counts only successes, and says when there are none", () => {
    const found = check([DAILY], { "capture.yml": [run("2026-10-08T05:20:00Z", "failure")] }, "2026-10-08T06:00:00Z");
    expect(found[0].message).toContain("has no success among its recent runs");
  });

  it("files a latest run that never started, even inside the window", () => {
    const runs = [run("2026-10-08T05:20:00Z", "startup_failure"), run("2026-10-07T05:20:00Z")];
    expect(check([DAILY], { "capture.yml": runs }, "2026-10-08T06:00:00Z")[0].message).toContain("startup_failure");
  });

  it("ignores runs after the instant it stands at", () => {
    const runs = [run("2026-10-09T05:20:00Z"), run("2026-10-06T05:20:00Z")];
    expect(check([DAILY], { "capture.yml": runs }, "2026-10-08T06:00:00Z")).toHaveLength(1);
  });

  it("leaves an unlisted workflow to the caller", () => {
    expect(check([DAILY], {}, "2026-10-08T06:00:00Z")).toEqual([]);
  });
});

describe("ratings, owed a success between 07:00 and 10:00 UTC", () => {
  const yesterday = { "ratings.yml": [run("2026-10-06T07:25:00Z")] };

  it("is quiet before today's deadline", () => {
    expect(check([RATINGS], yesterday, "2026-10-07T09:59:00Z")).toEqual([]);
  });

  it("files once 10:00 passes without one", () => {
    expect(check([RATINGS], yesterday, "2026-10-07T10:01:00Z")[0].source).toBe("ratings");
  });
});

describe("the Mac's jobs, by their alert.yml reports", () => {
  // Thursday 8 October, 18:05 London (BST) is 17:05 UTC.
  const thursdayEvening = "2026-10-08T17:05:00Z";

  it("files a pressers slot with no report", () => {
    expect(mac([], thursdayEvening).map((found) => found.source)).toContain("intel-pressers");
  });

  it("counts a fail as ran, because it was reported", () => {
    const found = mac([run("2026-10-08T15:20:00Z", "success", "alert intel-pressers fail")], thursdayEvening);
    expect(found.map((one) => one.source)).not.toContain("intel-pressers");
  });

  it("does not count a soft alert's report as the job's", () => {
    const found = mac([run("2026-10-08T15:20:00Z", "success", "alert intel-pressers-ingest fail")], thursdayEvening);
    expect(found.map((one) => one.source)).toContain("intel-pressers");
  });

  it("does not count a report from before the slot opened", () => {
    const found = mac([run("2026-10-08T14:50:00Z", "success", "alert intel-pressers ok")], thursdayEvening);
    expect(found.map((one) => one.source)).toContain("intel-pressers");
  });

  it("is quiet before the slot's deadline", () => {
    const tuesday = run("2026-10-06T07:30:00Z", "success", "alert intel-weekly ok");
    const lastFriday = run("2026-10-02T17:00:00Z", "success", "alert intel-pressers ok");
    expect(mac([tuesday, lastFriday], "2026-10-08T16:55:00Z")).toEqual([]);
  });

  it("reads London in winter as GMT", () => {
    // Friday 11 December: the 12:30 slot is 12:30 UTC and due at 14:00 UTC.
    const before = run("2026-12-11T12:20:00Z", "success", "alert intel-pressers ok");
    expect(mac([before], "2026-12-11T14:05:00Z").map((one) => one.source)).toContain("intel-pressers");
    const after = run("2026-12-11T12:40:00Z", "success", "alert intel-pressers ok");
    expect(mac([after, run("2026-12-08T08:10:00Z", "success", "alert intel-weekly ok")], "2026-12-11T14:05:00Z")).toEqual([]);
  });
});

describe("standAt", () => {
  const real = Date.parse("2026-10-07T12:00:00Z");

  it("reads now, an offset in hours, or an instant", () => {
    expect(standAt("", real)).toBe(real);
    expect(standAt("+31h", real)).toBe(real + 31 * HOUR);
    expect(standAt("2026-10-08T17:05:00Z", real)).toBe(Date.parse("2026-10-08T17:05:00Z"));
  });

  it("refuses anything else rather than guessing", () => {
    expect(() => standAt("Thursday", real)).toThrow(/ISO instant/);
  });
});

describe("the rules", () => {
  it("watch every scheduled workflow, the watchdog through capture-status", () => {
    const dir = join(import.meta.dirname, "..", "..", ".github", "workflows");
    const scheduled = readdirSync(dir).filter((name) => /^\s*schedule:/m.test(readFileSync(join(dir, name), "utf8")));
    const watched = [...WORKFLOW_RULES, WATCHDOG_RULE].map((rule) => rule.workflow);
    expect(watched.sort()).toEqual(scheduled.sort());
  });
});
