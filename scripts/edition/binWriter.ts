import { checkBin, type Fault } from "@epl/core";
import type { BinDesk } from "./binXi";
import { writeColumn, type Say } from "./newsroom";
import { faultSummary, serious } from "./sendBack";
import { BIN_XI_VOICE } from "./voice/binXi";
import { sheetsSendBack } from "./voice/sheets";

// The Bin XI's newsroom: written, read against its brief, sent back once. A column that still names
// a figure, a man or a market word the brief does not allow is not filed, and the next firing tries again.

export async function writeBin(desk: BinDesk, brief: string, say: Say): Promise<Record<string, unknown>> {
  const faultsOf = (column: Record<string, unknown>) => serious(checkBin(column, { brief, names: desk.names }));
  let column = await writeColumn(BIN_XI_VOICE, brief);
  let faults = faultsOf(column);
  if (faults.length > 0) {
    say(`  ↩ bin-xi: ${faults.length} faults, sent back once: ${faultSummary(faults)}`);
    const second = await writeColumn(BIN_XI_VOICE, `${brief}\n\n${sheetsSendBack(faults, (section) => `the ${section}`)}`).catch(() => null);
    const again = second === null ? null : faultsOf(second);
    if (second !== null && again !== null && worse(faults, again)) [column, faults] = [second, again];
  }
  const hard = faults.filter((fault) => fault.severity === "hard");
  if (hard.length > 0) throw new Error(`The Bin XI failed its checks twice: ${faultSummary(hard)}`);
  if (faults.length > 0) say(`  ⚠ bin-xi files with ${faults.length} send-backs unanswered: ${faultSummary(faults)}`);
  return { ...column, deck: desk.deck, bin: desk.cargo };
}

/** Whether the rewrite beats the first: fewer hard faults, then fewer faults. */
function worse(first: readonly Fault[], second: readonly Fault[]): boolean {
  const hard = (faults: readonly Fault[]) => faults.filter((fault) => fault.severity === "hard").length;
  return hard(second) < hard(first) || (hard(second) === hard(first) && second.length <= first.length);
}
