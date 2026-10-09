import type { ReactNode } from "react";
import { HAIRLINES } from "./rules";

// A column of the paper: a small-capital head over an ink rule, and rows split by hairlines, not cards.
// Not `shell/Section`, which is the desk's headed block; the head is ink, since rank on the sheet is set in scale.

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
      <div className={HAIRLINES}>
        {children}
      </div>
    </section>
  );
}
