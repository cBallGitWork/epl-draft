import type { Violation } from "@epl/core";
import { LABEL } from "@/app/desk";

// Under the planner: whether anything has been moved, and every league rule the arrangement breaks.

/** A broken rule, said out loud and with the number that broke it.
 *
 *  Most of these arrive already broken — the XI comes from Fantrax and the
 *  commissioner can narrow an eligibility or lower a cap underneath it — so the
 *  wording never implies the manager just did it. */
function sentence(violation: Violation, nameOf: (id: string) => string): string {
  switch (violation.kind) {
    case "too-many-active":
      return `${violation.count} in the XI — the league allows ${violation.cap}.`;
    case "too-many-reserve":
      return `${violation.count} on the bench — the league seats ${violation.cap}.`;
    case "position-over-cap":
      return `${violation.count} at ${violation.position} — the cap is ${violation.cap}.`;
    case "position-under-min":
      return `${violation.count} at ${violation.position} — the league wants ${violation.min}.`;
    case "not-eligible":
      return `${nameOf(violation.fantraxId)} is not eligible at ${violation.position}.`;
  }
}

export default function PlanStatus({
  dirty,
  onReset,
  broken,
  empty,
  nameOf,
}: {
  dirty: boolean;
  onReset: () => void;
  broken: Violation[];
  /** Places left in the XI, or null when the league sets no cap. */
  empty: number | null;
  nameOf: (id: string) => string;
}) {
  return (
    <>
      {/* Nothing at all until something has been moved. A count of eleven from
          eleven is a line of furniture telling a manager what he can see. */}
      {dirty ? (
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className={`font-display ${LABEL}`}>
            Planned — not submitted
          </h2>
          <button
            type="button"
            onClick={onReset}
            className="cm-bevel min-h-11 px-3 text-xs font-medium hover:brightness-110 lg:min-h-9"
          >
            Reset
          </button>
        </div>
      ) : null}

      {broken.length > 0 || (empty !== null && empty > 0) ? (
        <ul className="flex flex-col gap-1 border border-line bg-surface px-3 py-2">
          {broken.map((violation) => (
            <li key={sentence(violation, nameOf)} className="text-2xs text-bad">
              {sentence(violation, nameOf)}
            </li>
          ))}
          {/* Not a violation, and deliberately worded so it cannot be read as
              one: Fantrax publishes no minimum per position, so an under-filled
              XI breaks no rule the commissioner set. */}
          {empty !== null && empty > 0 ? (
            <li className="text-2xs text-muted">
              {empty} empty {empty === 1 ? "place" : "places"} in the XI — allowed, and nothing
              scores from them.
            </li>
          ) : null}
        </ul>
      ) : null}
    </>
  );
}
