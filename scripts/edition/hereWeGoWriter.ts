import { HERE_WE_GO_SIGN_OFF, checkTrade, type Fault } from "@epl/core";
import type { TradeJob } from "./hereWeGo";
import type { Say } from "./newsroom";
import { faultSummary, sendBackOnce } from "./sendBack";
import { HERE_WE_GO_VOICE } from "./voice/hereWeGo";
import { sheetsSendBack } from "./voice/sheets";

// Here We Go's newsroom: the item written by the helper model, read against its trade, sent back once. An item that
// still breaks a hard rule is not filed, and the next firing tries again.

export async function writeTrade(job: TradeJob, say: Say): Promise<Record<string, unknown>> {
  const attempts = await sendBackOnce(
    {
      desk: "trade",
      voice: HERE_WE_GO_VOICE,
      brief: job.brief,
      read: (column) => ({ column, faults: checkTrade(column, job) }),
      sendBack: (faults) => sheetsSendBack(faults, () => "the item"),
      tier: "helper",
    },
    say,
  );
  const best = attempts.reduce((a, b) => (rank(b.faults) < rank(a.faults) ? b : a));
  const hard = best.faults.filter((fault) => fault.severity === "hard");
  if (hard.length > 0) throw new Error(`Here We Go failed its checks: ${faultSummary(hard)}`);
  if (best.faults.length > 0) say(`  ⚠ trade files with ${best.faults.length} faults unanswered: ${faultSummary(best.faults)}`);
  return tradeColumn(job, best.column.body);
}

/** Hard faults first, then the rest: the attempt to keep is the one with fewer. */
const rank = (faults: readonly Fault[]) => faults.filter((fault) => fault.severity === "hard").length * 1000 + faults.length;

/** The item as it prints: the desk's headline, deck and picture's side, the writer's words, and the sign-off under them. */
export function tradeColumn(job: Pick<TradeJob, "headline" | "deck" | "transfer">, body: unknown): Record<string, unknown> {
  const item = typeof body === "string" ? body.trim() : "";
  return { headline: job.headline, deck: job.deck, body: `${item}\n\n${HERE_WE_GO_SIGN_OFF}`, transfer: job.transfer };
}
