import { execFileSync } from "node:child_process";
import { type Finding, MAC_RULES, type Run, WATCHDOG_RULE, WORKFLOW_RULES, findings, standAt } from "./watchdog/decide";

// What should have run by now and has not, each finding filed through scripts/ci/alert.sh under its own source.
// watchdog.yml runs it hourly; capture-status.yml runs it with --watchdog, to check only the watchdog. Actions only.
// Exits 1 when it could not list a workflow: a blind watchdog is an alert, never a skip.

const FIELDS = "displayTitle,status,conclusion,createdAt";

function listRuns(repo: string, workflow: string): Run[] {
  const out = execFileSync("gh", ["run", "list", "-R", repo, "--workflow", workflow, "--limit", "100", "--json", FIELDS], {
    encoding: "utf8",
  });
  return JSON.parse(out) as Run[];
}

function main(): void {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) throw new Error("GITHUB_REPOSITORY is unset: the watchdog runs in Actions");
  const now = standAt(process.env.NOW ?? "", Date.now());
  const only = (process.env.ONLY ?? "").trim();
  const self = process.argv.includes("--watchdog");
  const rules = self ? [WATCHDOG_RULE] : WORKFLOW_RULES;
  const mac = self ? [] : MAC_RULES;

  const listed = new Map<string, Run[]>();
  for (const workflow of [...rules.map((rule) => rule.workflow), ...(mac.length > 0 ? ["alert.yml"] : [])]) {
    try {
      listed.set(workflow, listRuns(repo, workflow));
    } catch (error) {
      console.error(`::error::could not list ${workflow}: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }

  const found: Finding[] = findings(rules, mac, listed, now).filter((one) => only === "" || one.source === only);
  console.log(`Standing at ${new Date(now).toISOString()}: ${found.length} overdue.`);
  for (const { source, message } of found) {
    console.log(`${source}: ${message}`);
    execFileSync("scripts/ci/alert.sh", [source, "fail", message], { stdio: "inherit" });
  }
}

main();
