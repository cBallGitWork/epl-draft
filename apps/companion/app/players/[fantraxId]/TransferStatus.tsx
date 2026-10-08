import type { ReactNode } from "react";
import type { Pedigree } from "@epl/core";
import { DASH, fantraxDay } from "@epl/core";
import Section from "../../components/shell/Section";
import Absent from "@/app/components/shell/Absent";
import { Value } from "./Pedigree";
import type { Arrival, PlayerMove } from "./dossier";

// CM's transfer status panel, for our league (Craig, 25 Sep 2026: "improve this page so its more
// CM like"): who holds him, how and when he got there, and what his draft pick cost.

const HOW: Readonly<Record<string, string>> = { claim: "Claimed", trade: "Traded", drop: "Dropped" };

export default function TransferStatus({
  holder,
  arrival,
  pedigree,
}: {
  /** The team holding him, or his status in words ("Free agent", "Waivers"). */
  holder: string | null;
  arrival: Arrival;
  pedigree: Pedigree;
}) {
  const drafted = pedigree.origin === "draft" ? pedigree : null;

  return (
    <Section title="Transfer status">
      <dl className="grid gap-x-6 lg:grid-cols-3">
        <Fact label="Held by">{holder}</Fact>
        <ArrivalLine arrival={arrival} drafted={drafted !== null} />
        <Fact label="Draft">
          {drafted === null ? (
            pedigree.origin === "unknown" ? null : "Undrafted"
          ) : (
            <span className="flex items-baseline gap-2">
              Round {drafted.round}, pick {drafted.overall}
              <Value against={drafted.against} />
            </span>
          )}
        </Fact>
      </dl>
    </Section>
  );
}

/** How he joined his holder, a dash when the log is partial; for a man nobody holds, who let him go, or nothing. */
function ArrivalLine({ arrival, drafted }: { arrival: Arrival; drafted: boolean }) {
  if (arrival === "unknown") return <Fact label="Joined">{null}</Fact>;
  if ("dropped" in arrival) {
    const { dropped } = arrival;
    if (dropped === null) return null;
    return <Fact label="Dropped by">{dated(dropped.fromName ?? DASH, dropped)}</Fact>;
  }
  const { joined } = arrival;
  const how = joined === null ? null : dated(HOW[joined.transaction.kind] ?? joined.transaction.kind, joined);
  return <Fact label="Joined">{how ?? (drafted ? "In the draft" : null)}</Fact>;
}

/** "Claimed, Wed 7 Oct": what, then the London day, which is left off when Fantrax gave none. */
function dated(what: string, move: PlayerMove): string {
  return [what, fantraxDay(move.transaction.processedAt ?? "")].filter(Boolean).join(", ");
}

/** One of CM's label-and-value lines: the label quiet, the value loud. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-9 items-baseline justify-between gap-3 border-b border-bg py-1 lg:flex-col lg:justify-start lg:gap-0.5 lg:border-b-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-chrome text-base font-bold text-ink lg:text-lg">{children ?? <Absent />}</dd>
    </div>
  );
}
