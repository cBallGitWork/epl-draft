import type { ReactNode } from "react";
import type { Pedigree } from "@epl/core";
import { DASH, fantraxTime } from "@epl/core";
import Section from "../../components/shell/Section";
import { Value } from "./Pedigree";
import type { PlayerMove } from "./dossier";

// CM's transfer status panel, for our league (Craig, 25 Sep 2026: "improve this page so its more
// CM like"): who holds him, how and when he got there, and what his draft pick cost.

const HOW: Readonly<Record<string, string>> = { claim: "Claimed", trade: "Traded", drop: "Dropped" };

export default function TransferStatus({
  holder,
  joined,
  pedigree,
}: {
  /** The team holding him, or his status in words ("Free agent", "Waivers"). */
  holder: string | null;
  joined: PlayerMove | null;
  pedigree: Pedigree;
}) {
  const drafted = pedigree.origin === "draft" ? pedigree : null;
  const arrival = joined
    ? [HOW[joined.transaction.kind] ?? joined.transaction.kind, fantraxTime(joined.transaction.processedAt ?? "")?.replace(/ \S+$/, "")]
        .filter(Boolean)
        .join(", ")
    : drafted
      ? "In the draft"
      : null;

  return (
    <Section title="Transfer status" aside="This league">
      <dl className="grid gap-x-6 lg:grid-cols-3">
        <Fact label="Held by">{holder}</Fact>
        <Fact label="Joined">{arrival}</Fact>
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

/** One of CM's label-and-value lines: the label quiet, the value loud. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-9 items-baseline justify-between gap-3 border-b border-bg py-1 lg:flex-col lg:justify-start lg:gap-0.5 lg:border-b-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-chrome text-base font-bold text-ink lg:text-lg">{children ?? <span className="text-faint">{DASH}</span>}</dd>
    </div>
  );
}
