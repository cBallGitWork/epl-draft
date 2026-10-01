import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FantraxError } from "@epl/core";

// One day's capture: each read written verbatim beside a manifest of what answered and what refused.

/** One endpoint asked once, written to `<method>.json`. */
export interface CaptureRead {
  method: string;
  run: () => Promise<unknown>;
}

/** One dated directory: a league's day, or the pool's (`leagueId` null, as it belongs to no league). */
export interface CaptureTarget {
  label: string;
  dir: string;
  leagueId: string | null;
  reads: readonly CaptureRead[];
}

export interface ReadOutcome {
  method: string;
  ok: boolean;
  /** The provider's code when it refused; `NO_TEAMS` before a draft is expected, not a fault. */
  code?: string;
  message?: string;
  bytes?: number;
}

async function capture(dir: string, { method, run }: CaptureRead): Promise<ReadOutcome> {
  try {
    const body = await run();
    const json = `${JSON.stringify(body, null, 2)}\n`;
    await writeFile(join(dir, `${method}.json`), json);
    console.log(`  ${method}: ${json.length} bytes`);
    return { method, ok: true, bytes: json.length };
  } catch (error) {
    if (!(error instanceof FantraxError)) throw error;
    console.log(`  ${method}: ${error.code}`);
    return { method, ok: false, code: error.code, message: error.message };
  }
}

/** Every target in turn, each with its manifest; one `capturedAt` so the directories agree. */
export async function captureDay(
  targets: readonly CaptureTarget[],
  capturedAt: string,
): Promise<ReadOutcome[]> {
  const outcomes: ReadOutcome[] = [];
  for (const { label, dir, leagueId, reads } of targets) {
    console.log(label);
    await mkdir(dir, { recursive: true });
    const targetOutcomes: ReadOutcome[] = [];
    for (const read of reads) targetOutcomes.push(await capture(dir, read));
    const manifest = { capturedAt, leagueId, reads: targetOutcomes };
    await writeFile(join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    outcomes.push(...targetOutcomes);
  }
  return outcomes;
}
