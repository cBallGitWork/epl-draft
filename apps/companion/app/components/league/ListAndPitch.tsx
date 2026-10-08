"use client";

import { type ReactNode, useState } from "react";
import { PANEL } from "@/app/desk";
import BothReadings from "./BothReadings";
import ViewToggle, { type View } from "./ViewToggle";

/** A squad's list and pitch: both above `lg`, one at a time behind the toggle below it, `opens` first. Given `beside`,
 *  the toggle shares its row and one panel frames the two, as a squad's sheet sets them. */
export default function ListAndPitch({
  opens,
  beside,
  list,
  pitch,
}: {
  opens: View;
  /** Beside the toggle on a phone and alone at the right on a desk: a squad's pending points and its week. */
  beside?: ReactNode;
  list: ReactNode;
  pitch: ReactNode;
}) {
  // Phone only — above `lg` both are drawn and the control is hidden.
  const [view, setView] = useState<View>(opens);
  const toggle = <ViewToggle view={view} onPick={setView} />;
  const both = <BothReadings view={view} list={list} pitch={pitch} />;

  return (
    <div className="flex flex-col gap-2">
      {beside === undefined ? (
        <div className="lg:hidden">{toggle}</div>
      ) : (
        <div className="flex items-center gap-2 px-1 lg:justify-end">
          <div className="flex flex-1 lg:hidden">{toggle}</div>
          {beside}
        </div>
      )}
      {beside === undefined ? both : <section className={PANEL}>{both}</section>}
    </div>
  );
}
