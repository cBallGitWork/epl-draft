import type { ReactNode } from "react";
import { PANEL } from "@/app/desk";

// A headed block with a rule under it, ON A PLATE: the shape every tab uses to
// say "this part is about that". It began as a column of the paper and moved
// here when the player card and the FPL tab hand-rolled the same six classes.
//
// **The plate is the section's, not each caller's** (Craig, 4 Sep 2026: "use the
// transparent ish panels in other pages and make sure that's now a universal
// shared property"). Four callers had started wrapping their own children in
// `PANEL` and the heading was left outside it every time, so every headed block
// in the app printed two strings — its title and its provenance — straight onto
// the photograph.
//
// **That was invisible until `groundfit.mjs` was repaired the same day.** The
// audit walked a text node's ancestors to `<html>`, which counted `<body>`'s
// opaque background, so `cover` reached 1.00 for everything and it could not
// fail. DESIGN §2's "Zero bare, 31 Aug 2026" was measured with it.
//
// It also makes the app MORE like the reference rather than less: `desk.css`
// already says "a CM screen is not one page with headings down it; it is several
// bevelled PANELS, each opening with its own title bar", and until now the desk
// was the first of those two things.
//
// `cm-panel` is translucent — `--color-surface` at 88% — so the photograph is
// still there behind it at about four parts in 255, which is what the ink ladder
// underneath was measured on.
//
// It renders whatever it is given, including nothing. Deciding a section is not
// worth printing belongs to the page that knows what is in it — the Gazetta
// drops an empty section rather than printing a box under a heading.

export default function Section({
  title,
  children,
  aside,
}: {
  /** Omitted by a section whose PLATE already names it — the Player Stats tab
   *  is headed `PLAYER STATS` by the strip above it and said it again here
   *  (Craig, 11 Sep 2026: *"remove Player stats"*). The rule and the aside stay,
   *  because whose figures these are is not on that plate. A section with
   *  neither draws no head row at all. */
  title?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  const heads = title !== undefined || aside !== undefined;
  return (
    <section className={PANEL}>
      {!heads ? null : (
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-1">
        {/* **The chrome face, not the figure one.** It was `font-display`, which
            `tokens.css` reserves for FIGURES — Archivo Narrow with `tnum` — and
            a panel's own title is chrome: `desk.css` puts `--font-chrome` on
            every plate for exactly this reason, and `Caption` and `PageHeader`
            were already in it. Craig, 5 Sep 2026: "for all rows, use the correct
            CM font please", and a heading over the rows is the same argument.
            One heading, and it is on every headed panel in the app. */}
        {title === undefined ? (
          <span />
        ) : (
          <h2 className="font-chrome text-2xs font-bold uppercase text-muted">{title}</h2>
        )}
        {aside ? <span className="text-2xs text-faint">{aside}</span> : null}
      </div>
      )}
      {children}
    </section>
  );
}
