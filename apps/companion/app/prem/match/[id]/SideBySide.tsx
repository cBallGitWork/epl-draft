import type { ReactNode } from "react";

/** A match's two sides: beside each other on the desk, stacked on a phone. `min-w-0` or a nowrap plate overflows 390. */
export default function SideBySide({ children }: { children: ReactNode }) {
  return <div className="grid min-w-0 gap-2 lg:grid-cols-2">{children}</div>;
}
