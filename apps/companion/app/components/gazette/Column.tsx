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
// The head is the league's own red over a red rule, in the small capitals a
// paper puts over a standing column. Red rather than ink, because on a page
// where every other mark is ink at an opacity the heads were competing with the
// masthead for the darkest thing on the sheet; the league's register separates
// them at 5.0:1 on this stock, which carries small text with room to spare.

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
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-league pb-1">
        <h2 className="font-sans text-2xs font-black uppercase tracking-[0.2em] text-league">
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
