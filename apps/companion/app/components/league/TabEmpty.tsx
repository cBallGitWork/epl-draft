import type { ReactNode } from "react";

// A team tab with nothing in it, under `TeamShell`'s strip so the other tabs stay in reach.
// Not `shell/Nothing`, which is a whole-page state.

export default function TabEmpty({ children }: { children: ReactNode }) {
  return (
    <section className="cm-panel px-3 py-6">
      <p className="text-center text-2xs text-muted">{children}</p>
    </section>
  );
}
