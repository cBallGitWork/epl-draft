import type { WriteAnswer } from "@epl/core";
import { LABEL } from "@/app/desk";
import { BUTTON } from "../shell/ButtonLink";

// Under the planner: Save and Reset once anything has moved, and what Fantrax said to the last save.

export default function SaveBar({
  dirty,
  canSave,
  legal,
  saving,
  answer,
  onSave,
  onReset,
}: {
  dirty: boolean;
  /** Whether this deployment saves to Fantrax at all. */
  canSave: boolean;
  /** Whether the arrangement keeps the league's rules; an illegal one is never sent. */
  legal: boolean;
  saving: boolean;
  answer: WriteAnswer | null;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <>
      {dirty ? (
        <div className="flex items-stretch gap-2">
          {canSave ? (
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !legal}
              className={`${BUTTON} cm-primary flex-1 text-base font-bold uppercase tracking-wide disabled:opacity-60`}
            >
              {saving ? "Saving…" : "Save lineup"}
            </button>
          ) : (
            <h2 className={`flex flex-1 items-center px-1 font-display ${LABEL}`}>Planned, not saved</h2>
          )}
          <button type="button" onClick={onReset} disabled={saving} className={BUTTON}>
            Reset
          </button>
        </div>
      ) : null}
      {answer?.ok === false ? (
        <ul className="flex flex-col gap-1 border border-line bg-surface px-3 py-2">
          {answer.messages.map((message) => (
            <li key={message} className="text-2xs text-bad">
              {message}
            </li>
          ))}
        </ul>
      ) : answer?.ok && !dirty ? (
        <p className="px-1 text-sm text-ink">Saved to Fantrax.</p>
      ) : null}
    </>
  );
}
