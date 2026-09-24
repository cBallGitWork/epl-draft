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
  captionOnPhone = true,
  children,
}: {
  header: React.ReactNode;
  nav: React.ReactNode;
  caption: React.ReactNode;
  rows: number;
  /** False where a phone needs the room more than the caption (Data, Craig 24 Sep 2026); the tab strip names the view. */
  captionOnPhone?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {header}
      {nav}
      {captionOnPhone ? (
        <Caption>{caption}</Caption>
      ) : (
        <div className="max-lg:hidden">
          <Caption>{caption}</Caption>
        </div>
      )}
      <section
        className={PANEL}
        style={{ minHeight: `calc(${rows} * var(--table-row) + var(--table-chrome))` }}
      >
        {children}
      </section>
    </div>
  );
}
