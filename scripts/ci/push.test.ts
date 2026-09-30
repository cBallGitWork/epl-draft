import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// push.sh against a bare repo in a temp dir: file:// remotes only, never GitHub.
const PUSH = join(import.meta.dirname, "push.sh");

let root: string;
let remote: string;
let env: NodeJS.ProcessEnv;

/** This process's environment minus anything that could aim git at this repo or at GitHub. */
function isolated(home: string): NodeJS.ProcessEnv {
  const kept = Object.entries(process.env).filter(
    ([key]) => !key.startsWith("GIT_") && !key.startsWith("GITHUB_"),
  );
  return {
    ...Object.fromEntries(kept),
    HOME: home,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: join(home, "gitconfig"),
    PUSH_BACKOFF_SCALE: "0",
  };
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: "pipe" }).trim();
}

function clone(name: string): string {
  git(root, "clone", "--quiet", `file://${remote}`, name);
  return join(root, name);
}

function stage(repo: string, file: string, text: string): void {
  writeFileSync(join(repo, file), text);
  git(repo, "add", file);
}

/** Another writer's commit, already on the remote. */
function pushed(repo: string, file: string, text: string, message: string): void {
  stage(repo, file, text);
  git(repo, "commit", "--quiet", "-m", message);
  git(repo, "push", "--quiet", "origin", "HEAD");
}

function push(repo: string, message: string): { status: number | null; output: string } {
  const run = spawnSync("bash", [PUSH, message, "nothing staged"], { cwd: repo, env, encoding: "utf8" });
  return { status: run.status, output: `${run.stdout}${run.stderr}` };
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "push-sh-"));
  remote = join(root, "remote.git");
  env = isolated(root);
  writeFileSync(
    env.GIT_CONFIG_GLOBAL ?? "",
    "[user]\n\tname = Test\n\temail = test@example.invalid\n[init]\n\tdefaultBranch = main\n",
  );
  git(root, "init", "--quiet", "--bare", remote);
  pushed(clone("seed"), "shared.txt", "one\n", "seed");
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("push.sh", () => {
  it("aborts a rebase that conflicts, names the file and keeps the commit", () => {
    const theirs = clone("theirs");
    const ours = clone("ours");
    pushed(theirs, "shared.txt", "theirs\n", "their change");
    stage(ours, "shared.txt", "ours\n");

    const run = push(ours, "our change");

    expect(run.status).toBe(1);
    expect(run.output).toMatch(/::error::.*shared\.txt/);
    expect(run.output).not.toContain("retrying");
    expect(existsSync(join(ours, ".git", "rebase-merge"))).toBe(false);
    expect(existsSync(join(ours, ".git", "rebase-apply"))).toBe(false);
    expect(git(ours, "log", "-1", "--format=%s")).toBe("our change");
    expect(git(remote, "log", "-1", "--format=%s")).toBe("their change");
  });

  it("rebases a clean commit over one pushed meanwhile and lands it", () => {
    const theirs = clone("theirs");
    const ours = clone("ours");
    pushed(theirs, "theirs.txt", "theirs\n", "their change");
    stage(ours, "ours.txt", "ours\n");

    const run = push(ours, "our change");

    expect(run.status).toBe(0);
    expect(git(remote, "log", "--format=%s")).toBe("our change\ntheir change\nseed");
  });

  it("retries a push that failed without a conflict, then gives up", () => {
    const ours = clone("ours");
    git(ours, "remote", "set-url", "origin", `file://${join(root, "gone.git")}`);
    stage(ours, "ours.txt", "ours\n");

    const run = push(ours, "our change");

    expect(run.status).toBe(1);
    expect(run.output.match(/retrying/g)).toHaveLength(5);
    expect(run.output).toContain("::error::could not push after 5 attempts");
  });
});
