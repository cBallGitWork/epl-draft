import LeagueCrest from "./LeagueCrest";

// How a section opens: the crest, the title, and at most a line or two under it.
// Five screens had grown their own copy of this header by the time /matchup
// added a sixth, which is well past the rule of 2/3 — and the copies were
// already drifting (`truncate` on one h1 and not the others). The matchday
// screen keeps its own header on purpose: baseline-aligned with a live badge on
// the right, it is a different design, not a seventh copy of this one.
//
// **A CM title bar, because every one of its consumers is the Desk.** The paper
// has its own masthead and never reaches this file, so the royal-blue bar with
// the bold white title on it — the thing every Championship Manager screen opens
// with — can be the shared shape rather than one screen's special case.
//
// The `sub` line sits UNDER the bar rather than inside it. CM's title bars carry
// a title and nothing else, and a count or a date set in the bar would make the
// bar the place where content lives.

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
    <header>
      <div className="cm-titlebar flex items-center gap-2 px-2 py-1">
        <LeagueCrest height={18} />
        <h1 className="min-w-0 flex-1 truncate text-sm font-bold uppercase text-ink">
          {title}
        </h1>
      </div>
      {sub ? <p className="numeric px-2 pt-1 text-2xs text-faint">{sub}</p> : null}
      {children}
    </header>
  );
}
