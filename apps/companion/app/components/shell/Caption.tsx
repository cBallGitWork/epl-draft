import type { ReactNode } from "react";

// The yellow caption naming what is in a panel; the blue bar above names the screen.
// Its height is stated, not padded: 28 on a phone (read, never tapped, so not the 44 floor), 40 on a desk.
// `deskOnly` hides it on a phone, where the strip's current tab already names the view.
export default function Caption({ deskOnly = false, children }: { deskOnly?: boolean; children: ReactNode }) {
  return (
    <section className={`cm-panel flex min-h-7 items-center justify-center px-2 lg:min-h-10 ${deskOnly ? "max-lg:hidden" : ""}`}>
      <p className="cm-title text-center font-chrome text-sm font-bold text-accent lg:text-2xl">
        {children}
      </p>
    </section>
  );
}
