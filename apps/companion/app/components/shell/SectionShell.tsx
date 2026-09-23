import Caption from "./Caption";
import { PANEL } from "@/app/desk";

/** A desk section: its bar, its tabs, the caption on a box of its own, and the content's panel.
 *  The panel holds `rows` rows at the width's own `--table-row`, so a short list still draws the
 *  screen's shape rather than shrinking to its contents. */
export default function SectionShell({
  header,
  nav,
  caption,
  rows,
  children,
}: {
  header: React.ReactNode;
  nav: React.ReactNode;
  caption: React.ReactNode;
  rows: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {header}
      {nav}
      <Caption>{caption}</Caption>
      <section
        className={PANEL}
        style={{ minHeight: `calc(${rows} * var(--table-row) + var(--table-chrome))` }}
      >
        {children}
      </section>
    </div>
  );
}
