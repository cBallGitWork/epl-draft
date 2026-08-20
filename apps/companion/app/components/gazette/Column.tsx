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
// The head is cream on a red rule because this is the one page where the league
// register leads. Everywhere else it marks a single row and nothing more.

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
      <div className="flex items-baseline justify-between gap-3 border-b border-league/40 pb-1">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-cream">
          {title}
        </h2>
        {aside ? <span className="text-2xs text-faint">{aside}</span> : null}
      </div>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}
