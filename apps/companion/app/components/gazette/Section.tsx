import type { ReactNode } from "react";

// A column of the paper. Only ever rendered around something worth reading —
// the edition drops a section with nothing in it rather than printing an empty
// box under a heading.

export default function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-1">
        <h2 className="font-display text-2xs font-bold uppercase tracking-widest text-muted">
          {title}
        </h2>
        {aside ? <span className="text-2xs text-faint">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}
