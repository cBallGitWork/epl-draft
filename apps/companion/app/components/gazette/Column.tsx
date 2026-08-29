import type { ReactNode } from "react";

// A column of the paper: a ruled head in the league's register, and rows
// separated by hairlines rather than stacked as cards.
//
// Deliberately not `shell/Section`, which is the app's headed block and is right
// on the four screens that use it. This is the front page, where the difference
// is the point: a newspaper is ink and rules on a page, and a column of rounded,
// bordered, elevated boxes is a settings screen no matter what is printed in it.
// Same information, and the only thing between two items is a hairline.
//
// The head is a full-strength ink rule with the label in small caps above it —
// the standing head a paper puts over a column. Everything else on the page is
// ink at an opacity, so the heads are the darkest thing on it after the
// masthead, which is the hierarchy doing the work rather than a colour.

export default function Column({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col">
      <div
        className="flex items-baseline justify-between gap-3 border-b pb-1"
        style={{ borderColor: "currentColor" }}
      >
        <h2 className="text-2xs font-black uppercase tracking-[0.2em]">{title}</h2>
        {aside ? <span className="text-2xs opacity-55">{aside}</span> : null}
      </div>
      <div className="divide-y" style={{ borderColor: "var(--paper-rule)" }}>
        {children}
      </div>
    </section>
  );
}
