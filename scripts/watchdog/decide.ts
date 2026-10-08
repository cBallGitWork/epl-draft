// What should have run by now and has not: the watchdog's verdict, pure, so a test can stand at any hour.

/** A run as `gh run list --json displayTitle,status,conclusion,createdAt` lists it. */
export interface Run {
  displayTitle: string;
  status: string;
  conclusion: string;
  createdAt: string;
}

/** What to alert, under the source whose issue it belongs to (`scripts/ci/alert.sh`). */
export interface Finding {
  source: string;
  message: string;
}

/** A window a job owes a report in: from `start` on one of `weekdays` (0 is Sunday), by `due`, wall-clock in `zone`. */
export interface Slot {
  weekdays: readonly number[];
  start: string;
  due: string;
  zone: string;
}

/** A scheduled workflow and the success it owes: one within `within` hours, or one inside its daily `slot`. */
export type WorkflowRule = { workflow: string; within: number } | { workflow: string; slot: Slot };

/** A launchd job on the Mac, which reports through an alert.yml run named `alert <source> ok|fail`. */
export interface MacRule {
  source: string;
  slots: readonly Slot[];
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const LONDON = "Europe/London";
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/** Every scheduled workflow but this one; a test holds the list to `.github/workflows`. Dailies get 30h: crons run late. */
export const WORKFLOW_RULES: readonly WorkflowRule[] = [
  { workflow: "capture.yml", within: 30 },
  { workflow: "capture-status.yml", within: 30 },
  { workflow: "ingest-stats.yml", within: 30 },
  { workflow: "intel-check.yml", within: 30 },
  // Its longest gap is Tuesday 22:30 to Wednesday 17:00 UTC.
  { workflow: "editions.yml", within: 30 },
  { workflow: "scout-xi.yml", within: 26 },
  // The 07:20 UTC sweep rates the night's match day; it owes a success by 10:00.
  { workflow: "ratings.yml", slot: { weekdays: EVERY_DAY, start: "07:00", due: "10:00", zone: "UTC" } },
  // Friday to Monday only: Monday 22:30 to Friday 17:00 UTC is its longest gap.
  { workflow: "warm.yml", within: 96 },
  // Every two hours from 06:25 UTC; its longest gap is 22:25 to 06:25.
  { workflow: "health.yml", within: 9 },
];

/** The watchdog itself, checked from capture-status.yml so it is not its own only witness. */
export const WATCHDOG_RULE: WorkflowRule = { workflow: "watchdog.yml", within: 3 };

/** `scripts/install-intel-jobs.sh`'s slots, London time; a fail counts as ran, because it has been reported. */
export const MAC_RULES: readonly MacRule[] = [
  { source: "intel-weekly", slots: [{ weekdays: [2], start: "08:00", due: "12:00", zone: LONDON }] },
  {
    source: "intel-pressers",
    slots: [
      { weekdays: [4], start: "16:00", due: "18:00", zone: LONDON },
      { weekdays: [5], start: "12:30", due: "14:00", zone: LONDON },
      { weekdays: [5], start: "17:45", due: "18:30", zone: LONDON },
    ],
  },
];

/** The instant the watchdog stands at: now, `+<n>h` from now, or an ISO instant, for a test run by hand. */
export function standAt(input: string, real: number): number {
  const text = input.trim();
  if (text === "") return real;
  const ahead = /^\+(\d+)h$/.exec(text);
  if (ahead !== null) return real + Number(ahead[1]) * HOUR;
  const at = Date.parse(text);
  if (Number.isNaN(at)) throw new Error(`now must be an ISO instant or +<hours>h, not "${input}"`);
  return at;
}

/** A wall-clock time on a calendar day in `zone`, as an instant. */
function wallClock(day: string, time: string, zone: string): number {
  const asUtc = new Date(`${day}T${time}:00Z`);
  const shown = new Date(asUtc.toLocaleString("en-US", { timeZone: zone }));
  const utc = new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" }));
  return asUtc.getTime() - (shown.getTime() - utc.getTime());
}

function dayIn(at: number, zone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

/** The slot whose deadline passed most recently, looking back a week. */
function lastDue(slots: readonly Slot[], now: number): { start: number; due: number; slot: Slot } | null {
  let last: { start: number; due: number; slot: Slot } | null = null;
  for (let back = 0; back <= 7; back++) {
    for (const slot of slots) {
      const day = dayIn(now - back * DAY, slot.zone);
      if (!slot.weekdays.includes(new Date(`${day}T12:00:00Z`).getUTCDay())) continue;
      const due = wallClock(day, slot.due, slot.zone);
      if (due <= now && (last === null || due > last.due)) last = { start: wallClock(day, slot.start, slot.zone), due, slot };
    }
  }
  return last;
}

function utc(at: number): string {
  return `${new Date(at).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

function sourceOf(workflow: string): string {
  return workflow.replace(/\.ya?ml$/, "");
}

function workflowFindings(rule: WorkflowRule, runs: readonly Run[], now: number): Finding[] {
  const seen = runs.filter((run) => Date.parse(run.createdAt) <= now).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const source = sourceOf(rule.workflow);
  const found: Finding[] = [];
  if (seen[0]?.conclusion === "startup_failure") {
    found.push({ source, message: `${rule.workflow}'s latest run, at ${utc(Date.parse(seen[0].createdAt))}, never started (startup_failure).` });
  }
  const success = seen.find((run) => run.conclusion === "success");
  const last = success === undefined ? null : Date.parse(success.createdAt);
  const since = last === null ? "has no success among its recent runs" : `last succeeded at ${utc(last)}`;
  if ("within" in rule) {
    if (last === null || last < now - rule.within * HOUR) {
      found.push({ source, message: `${rule.workflow} ${since}; it owes one every ${rule.within}h.` });
    }
  } else {
    const due = lastDue([rule.slot], now);
    if (due !== null && (last === null || last < due.start)) {
      found.push({ source, message: `${rule.workflow} owed a success between ${utc(due.start)} and ${utc(due.due)}, and ${since}.` });
    }
  }
  return found;
}

function macFindings(rule: MacRule, reports: readonly Run[], now: number): Finding[] {
  const due = lastDue(rule.slots, now);
  if (due === null) return [];
  const name = new RegExp(`^alert ${rule.source} (ok|fail)$`);
  const reported = reports.some((run) => name.test(run.displayTitle) && Date.parse(run.createdAt) >= due.start && Date.parse(run.createdAt) <= now);
  if (reported) return [];
  const slot = `${due.slot.start} ${due.slot.zone} slot (${utc(due.start)})`;
  return [{ source: rule.source, message: `The Mac's ${rule.source} job sent no report for its ${slot} by ${due.slot.due}. Asleep, offline, or launchd unloaded?` }];
}

/** Every finding at `now`. A workflow missing from `listed` was not listed, which the caller reports itself. */
export function findings(
  workflows: readonly WorkflowRule[],
  mac: readonly MacRule[],
  listed: ReadonlyMap<string, readonly Run[]>,
  now: number,
): Finding[] {
  const reports = listed.get("alert.yml");
  return [
    ...workflows.flatMap((rule) => {
      const runs = listed.get(rule.workflow);
      return runs === undefined ? [] : workflowFindings(rule, runs, now);
    }),
    ...(reports === undefined ? [] : mac.flatMap((rule) => macFindings(rule, reports, now))),
  ];
}
