import LeagueCrest from "./LeagueCrest";

// How a section opens: the crest, the title, and at most a line or two under it.
// Five screens had grown their own copy of this header by the time /matchup
// added a sixth, which is well past the rule of 2/3 — and the copies were
// already drifting (`truncate` on one h1 and not the others). The matchday
// screen keeps its own header on purpose: baseline-aligned with a live badge on
// the right, it is a different design, not a seventh copy of this one.

export default function PageHeader({
  title,
  sub,
  children,
}: {
  title: string;
  /** The line under the title — a count, a period, a date. Styled here because
   *  three pages had written the identical classes on it (§1). */
  sub?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex items-center gap-2.5 pt-1">
      <LeagueCrest height={26} />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
        {sub ? <p className="numeric text-2xs text-faint">{sub}</p> : null}
        {children}
      </div>
    </header>
  );
}
