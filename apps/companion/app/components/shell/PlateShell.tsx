import type { CSSProperties, ReactNode } from "react";
import type { ClubColours } from "@epl/core";
import { plateOn } from "@epl/core";
import BackPlate from "./BackPlate";
import PageHeader from "./PageHeader";

// The frame a screen about a subject wears (a team, a club, a player): his colour on the bar, his tabs
// under it, and every table inside in his colours. `plateOn` picks the ink that survives the fill.

export default function PlateShell({
  colours,
  title,
  back,
  phoneBar = true,
  tabs,
  children,
}: {
  /** Already resolved: a manager's come from `teamColours`, a club's and a player's from `clubColours`. */
  colours: ClubColours;
  /** What goes on the bar, and nothing else. */
  title: string;
  /** Where the phone's back plate goes with no history; absent draws none. */
  back?: string;
  /** Whether a phone draws the bar: your own team's is the lit Team tab already, and its room goes to the pitch. */
  phoneBar?: boolean;
  tabs: ReactNode;
  children: ReactNode;
}) {
  const plate = plateOn(colours);
  const header = <PageHeader title={title} plate={plate} />;

  return (
    // `--cm-index` re-points every table's index block at the subject's colour; `cm-index-scoped` stops
    // that block greying, which on a purple chip read 3.89:1 (`desk.css`).
    <div
      className="cm-index-scoped flex flex-col gap-2"
      style={
        {
          "--cm-index": plate.background,
          "--cm-index-ink": plate.ink,
        } as CSSProperties
      }
    >
      {back === undefined ? (
        phoneBar ? header : <div className="max-lg:hidden">{header}</div>
      ) : (
        <div className="flex items-stretch">
          <BackPlate fallback={back} />
          <div className="min-w-0 flex-1">{header}</div>
        </div>
      )}
      {tabs}
      {children}
    </div>
  );
}
