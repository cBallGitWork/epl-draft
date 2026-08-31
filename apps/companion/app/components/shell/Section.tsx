import type { ReactNode } from "react";

// A headed block with a rule under it: the shape every tab uses to say "this
// part is about that". It began as a column of the paper and moved here when
// the player card and the FPL tab hand-rolled the same six classes.
//
// It renders whatever it is given, including nothing. Deciding a section is not
// worth printing belongs to the page that knows what is in it — the Gazetta
// drops an empty section rather than printing a box under a heading.

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
        <h2 className="font-display text-2xs font-bold uppercase text-muted">
          {title}
        </h2>
        {aside ? <span className="text-2xs text-faint">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}
