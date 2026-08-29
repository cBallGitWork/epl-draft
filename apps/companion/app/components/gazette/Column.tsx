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
// The head is ink over an ink rule, in the small capitals a paper puts over a
// standing column. It was the league's red over a red rule, on the argument
// that ink heads would compete with the masthead for the darkest mark on the
// sheet — but a masthead outweighs a 10px label by size and weight, not by
// hue, and eight red heads down a page is what made the front page read as a
// themed screen rather than as newsprint. Rank is set in scale here, and the
// sheet's one red is spent on the things that are actually live.

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
        <h2 className="font-sans text-2xs font-black uppercase tracking-[0.2em]">
          {title}
        </h2>
        {aside ? <span className="font-sans text-2xs text-muted">{aside}</span> : null}
      </div>
      <div className="divide-y" style={{ borderColor: "var(--paper-rule)" }}>
        {children}
      </div>
    </section>
  );
}
