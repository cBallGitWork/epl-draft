import { checkBin, type Fault } from "@epl/core";
import type { BinDesk } from "./binXi";
import { writeColumn } from "./newsroom";
import { BIN_XI_VOICE } from "./voice/binXi";
import { sheetsSendBack } from "./voice/sheets";

// The Bin XI's newsroom: written, read against its brief, sent back once. A column that still names
// a figure, a man or a market word the brief does not allow is not filed, and the next firing tries again.

export async function writeBin(desk: BinDesk, brief: string, say: (message: string) => void): Promise<Record<string, unknown>> {
  const faultsOf = (column: Record<string, unknown>) => checkBin(column, { brief, names: desk.names }).filter((fault) => fault.severity !== "warn");
  let column = await writeColumn(BIN_XI_VOICE, brief);
  let faults = faultsOf(column);
  if (faults.length > 0) {
    say(`  ↩ bin-xi: ${faults.length} faults, sent back once: ${summary(faults)}`);
    const second = await writeColumn(BIN_XI_VOICE, `${brief}\n\n${sheetsSendBack(faults, (section) => `the ${section}`)}`).catch(() => null);
    const again = second === null ? null : faultsOf(second);
    if (second !== null && again !== null && worse(faults, again)) [column, faults] = [second, again];
  }
  const hard = faults.filter((fault) => fault.severity === "hard");
  if (hard.length > 0) throw new Error(`The Bin XI failed its checks twice: ${summary(hard)}`);
  if (faults.length > 0) say(`  ⚠ bin-xi files with ${faults.length} send-backs unanswered: ${summary(faults)}`);
  return { ...column, deck: desk.deck, bin: desk.cargo };
}

/** Whether the rewrite beats the first: fewer hard faults, then fewer faults. */
function worse(first: readonly Fault[], second: readonly Fault[]): boolean {
  const hard = (faults: readonly Fault[]) => faults.filter((fault) => fault.severity === "hard").length;
  return hard(second) < hard(first) || (hard(second) === hard(first) && second.length <= first.length);
}

function summary(faults: readonly Fault[]): string {
  return faults.slice(0, 6).map((fault) => `${fault.check} (${fault.evidence})`).join(", ");
}
