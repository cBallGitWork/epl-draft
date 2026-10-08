import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { XMINS_MOVE, type IntelMinuteMoves, type IntelProjections, minutesUpdate } from "@epl/core";
import { intelManifest, intelPath, readIntel, writeIntel } from "./intel";
import { INTEL_ROOT } from "./paths";

// What a run's xMins export moved against the one committed before it, kept as one update per export. Run by
// `scripts/sync-intel.sh` after every run takes its files, so a Tuesday export writes the scout's letter as a Friday one does.

const PROJECTIONS = intelPath("projections");

const repo = join(INTEL_ROOT, "..", "..");
const path = relative(repo, PROJECTIONS);
// HEAD is origin/main in the run's worktree: the export this run's replaces.
const previous = JSON.parse(execFileSync("git", ["-C", repo, "show", `HEAD:${path}`], { encoding: "utf8", maxBuffer: 1 << 26 })) as IntelProjections;
const next = JSON.parse(readFileSync(PROJECTIONS, "utf8")) as IntelProjections;

const update = minutesUpdate(previous, next, XMINS_MOVE);
if (update === null) {
  console.log("xmins-moves: nobody's xMins moved past the bar");
  process.exit(0);
}

const held = readIntel<IntelMinuteMoves>("xmins-moves");
const updates = (held?.updates ?? []).filter((each) => each.at !== update.at);
updates.push(update);
const file: IntelMinuteMoves = {
  manifest: intelManifest({ gameweek: update.gameweek, rows: updates.length, sources: [{ path, mtime: next.manifest.exportedAt }] }),
  updates,
};
writeIntel("xmins-moves", `${JSON.stringify(file, null, 2)}\n`);
console.log(`xmins-moves: ${update.moves.length} men's xMins moved for gameweek ${update.gameweek}`);
