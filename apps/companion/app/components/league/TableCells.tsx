import type { ReactNode } from "react";
import { INDEX_WIDTH, MINOR_LABEL } from "@/app/desk";

// The two cells a CM board's rows are built from, opposite `TableHeads`.
// No crest-and-name cell: its callers differ in size, fallback and alignment.

/** The ordinal in CM's index block, in the colour a team's or club's shell gives `--cm-index`. */
export function IndexCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`cm-index ${INDEX_WIDTH} numeric px-1.5 text-center ${className}`}>{children}</td>;
}

/** The name cell's link on a board row. `min-h-11` is the phone's tap floor and `.cm-row` only takes the row to 28
 *  from `lg`, so both are needed. */
export const ROW_LINK = "cm-row flex min-h-11 items-center gap-2 hover:underline";

/** A Draft-tab table row: 36px under a thumb (PRODUCT.md), CM's 28 from `lg`. */
export const TIGHT_ROW = "cm-row flex min-h-9 items-center gap-2";

/** The points in a block of their own, the way CM ends its table: the eye runs down the column to find them. */
export function PointsCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <td className={`p-0 ${className}`}>
      <span className="cm-index numeric flex min-h-7 items-center justify-center px-1.5">{children}</span>
    </td>
  );
}

/** A dashed rule across a table naming what it separates. `tone` is the rule's border colour, written out in full. */
export function CutRow({ span, label, tone }: { span: number; label: string; tone: string }) {
  return (
    <tr aria-hidden>
      <td colSpan={span} className="p-0">
        <span className={`flex items-center gap-2 py-0.5 ${MINOR_LABEL}`}>
          <span className={`flex-1 border-t border-dashed ${tone}`} />
          {label}
          <span className={`flex-1 border-t border-dashed ${tone}`} />
        </span>
      </td>
    </tr>
  );
}
