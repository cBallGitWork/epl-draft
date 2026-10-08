import type { WriteAnswer } from "@epl/core";
import { LABEL } from "@/app/desk";
import { BUTTON, STRONG_BUTTON } from "../shell/ButtonLink";

// The planner's footer, always in view: docked above the thumb rail under a thumb and at the window's foot on a
// desk. Save stays greyed until the lineup differs from the one Fantrax holds; where saving is off it shows once
// anything has moved.

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
  if (!canSave && !dirty) return null;
  const ready = dirty && legal && !saving;

  return (
    <div className="bleed sticky bottom-[var(--thumbrail)] z-20 flex flex-col gap-1 border-t border-line bg-bg px-[var(--page-gutter)] lg:bottom-0 lg:py-1">
      {answer?.ok === false ? (
        <ul className="flex flex-col gap-1 pt-1.5">
          {answer.messages.map((message) => (
            <li key={message} className="text-2xs text-bad">
              {message}
            </li>
          ))}
        </ul>
      ) : answer?.ok && !dirty ? (
        <p className="px-1 pt-1.5 text-sm text-ink">Saved to Fantrax.</p>
      ) : null}
      <div className="flex items-stretch gap-2">
        {canSave ? (
          <button
            type="button"
            onClick={onSave}
            disabled={!ready}
            className={`${STRONG_BUTTON} flex-1 uppercase ${ready ? "cm-primary" : "opacity-60"}`}
          >
            {saving ? "Saving…" : "Save lineup"}
          </button>
        ) : (
          <h2 className={`flex flex-1 items-center px-1 font-chrome ${LABEL}`}>Planned, not saved</h2>
        )}
        <button type="button" onClick={onReset} disabled={!dirty || saving} className={`${BUTTON} disabled:opacity-60`}>
          Reset
        </button>
      </div>
    </div>
  );
}
