import { MS_PER_MINUTE, type WriteAnswer } from "@epl/core";
import { labelsOf, momentOf, teamPlan, type TeamPlan } from "./plan";

// One deadline's pass: wait for the write moment if asked, then number every bench nobody numbered, by total points.
// Every read and write is injected, so a test can stand at any minute and hold Fantrax's answers.

export interface Deps {
  now(): number;
  sleep(ms: number): Promise<void>;
  /** The first period whose lineups have not locked, with its lock; null when no period ahead has one. */
  next(): Promise<{ period: number; lock: string | null } | null>;
  /** One period's lock, read again after a wait: a fixture moved while we slept moves it. */
  lockOf(period: number): Promise<string | null>;
  teams(): Promise<{ teamId: string; name: string }[]>;
  roster(teamId: string, period: number): Promise<unknown>;
  write(teamId: string, period: number, map: Record<string, number>): Promise<WriteAnswer>;
  log(line: string): void;
}

export interface Options {
  /** Send the writes; without it the run prints what it would send. */
  write: boolean;
  /** Sleep until the write moment when the lock is before tomorrow's horizon. */
  wait: boolean;
}

/** A lock moved later while the run slept is waited for again, this many times at most. */
const MAX_WAITS = 3;

/** The run's exit code: 1 when any read or write failed, or the lock passed before the write. */
export async function benchOrderRun(deps: Deps, options: Options): Promise<number> {
  const next = await deps.next();
  if (next === null) {
    deps.log("No period ahead has a lock: nothing to order.");
    return 0;
  }
  const { period } = next;
  let moment = momentOf(next.lock, deps.now());
  for (let waits = 0; options.wait && moment.kind === "wait" && waits < MAX_WAITS; waits++) {
    deps.log(`Period ${period} locks at ${moment.lock}; waiting ${Math.round(moment.ms / MS_PER_MINUTE)} minutes to write.`);
    await deps.sleep(moment.ms);
    moment = momentOf(await deps.lockOf(period), deps.now());
  }

  // A lock gone or passed by now was read again after a wait: the write it was waiting for never went.
  if (moment.kind === "no-lock" || moment.kind === "locked") {
    deps.log(moment.kind === "locked" ? `Period ${period} locked at ${moment.lock} before its benches were ordered.` : `Period ${period} has no lock now.`);
    return moment.kind === "locked" && options.write ? 1 : 0;
  }
  if (moment.kind !== "now") {
    deps.log(
      moment.kind === "not-due"
        ? `Period ${period} locks at ${moment.lock}, after 08:00 tomorrow: the next morning's run writes it.`
        : `Period ${period} locks at ${moment.lock}: benches are written only in its last minutes.`,
    );
    // A dry run goes on to print what it would write.
    if (options.write) return 0;
  }
  const lock = Date.parse(moment.lock);

  let failed = 0;
  let written = 0;
  for (const team of await deps.teams()) {
    try {
      const raw = await deps.roster(team.teamId, period);
      const plan = teamPlan(raw, period);
      deps.log(`${team.name}: ${describe(plan, labelsOf(raw), options.write)}`);
      if (plan.kind === "unread") failed++;
      if (plan.kind !== "write" || !options.write) continue;
      // adminMode overrides a lock, so the clock is read again before every write.
      if (deps.now() >= lock) {
        failed++;
        deps.log(`  not written: period ${period} locked at ${moment.lock}`);
        continue;
      }
      const answer = await deps.write(team.teamId, period, plan.map);
      if (answer.ok) written++;
      else {
        failed++;
        deps.log(`  refused: ${answer.messages.join("; ")}`);
      }
    } catch (error) {
      failed++;
      deps.log(`${team.name}: failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  deps.log(`Period ${period}: ${options.write ? `${written} written` : "dry run, nothing written"}, ${failed} failed.`);
  return failed > 0 ? 1 : 0;
}

function describe(plan: TeamPlan, labels: ReadonlyMap<string, string>, write: boolean): string {
  const names = (order: readonly string[]) => order.map((id, i) => `${i + 1} ${labels.get(id) ?? id}`).join(", ");
  switch (plan.kind) {
    case "numbered":
      return `numbered already (${names(plan.order)}); left alone`;
    case "no-bench":
      return "no bench";
    case "unread":
      return `roster read as period ${plan.period ?? "unknown"}; left alone`;
    case "write":
      return `${write ? "writing" : "would write"} ${names(plan.order)}`;
  }
}
