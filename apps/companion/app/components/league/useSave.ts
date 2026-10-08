import { useState } from "react";
import type { RosterSlot, WriteAnswer } from "@epl/core";
import { saveLineup } from "@/app/squad/[teamId]/save";

// Sending the plan to Fantrax: one save in flight at a time, and what Fantrax said last.

export function useSave(period: number, plan: { slots: RosterSlot[]; bench: string[]; reordered: boolean }, onSaved: () => void) {
  const [saving, setSaving] = useState(false);
  const [answer, setAnswer] = useState<WriteAnswer | null>(null);

  /** True when Fantrax took it. */
  async function save(): Promise<boolean> {
    if (saving) return false;
    setSaving(true);
    try {
      const result = await saveLineup({ period, ...plan });
      setAnswer(result);
      if (result.ok) onSaved();
      return result.ok;
    } catch {
      setAnswer({ ok: false, messages: ["The save did not reach Fantrax. Try again."] });
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { saving, answer, save, clear: () => setAnswer(null) };
}
