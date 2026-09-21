"use client";

import { useState } from "react";
import DialogFoot from "../../../components/shell/DialogFoot";
import Modal from "../../../components/shell/Modal";
import { PLAYER } from "../../routes";

// One man's afternoon, over the team sheet rather than instead of it.
//
// Craig, 11 Sep 2026: *"clicking on a player brings up pop up player card"*.
//
// **A dialog and not a route, for the reason `league/PlayerCard` already gives**:
// the question a tap asks is "what did HE do" while reading an eighteen-man
// sheet, and navigating away to answer it loses the sheet. The way out to the
// full profile is still offered, because that page knows a season's worth this
// one cannot fit.
//
// **It says only what the row it opened from already holds.** No read, no
// second join, no loading state — everything here was rendered a moment ago in
// six or seven pixels of a table row, and the card is the same facts at a size
// you can look at. That is also why it is the ROW that is the trigger rather
// than a button beside it: the sticker you tapped is the subject.
//
// `Modal` owns Escape, the focus trap and the backdrop; this owns the open
// state, because `Modal`'s own docblock says a caller is rendered conditionally
// by a parent holding it.

/** What one row knows about a man. Plain data, so the server component that
 *  builds the board can hand it across the boundary without sending a map, a
 *  provider type or a join function with it. */
export interface MatchMan {
  code: number | null;
  name: string;
  /** `G`, `D`, `M` or `F` — the Premier League's own, for this match. */
  position: string | null;
  shirt: number | null;
  captain: boolean;
  club: string;
  /** The league squad holding him, or null for a man nobody drafted. */
  owner: string | null;
  /** Null for a man who never got on, where a nought would be a claim about an
   *  afternoon he had no part in (DESIGN §7). */
  points: number | null;
  onAt: number | null;
  offAt: number | null;
  booked: number | null;
  sentOff: number | null;
  /** Whether he went off injured, which the commentary says and no field does. */
  hurt: boolean;
  /** Already resolved by the board — label and tone, not a provider row. */
  marks: { label: string; className: string }[];
  bench: boolean;
}

export default function MatchPlayerCard({
  man,
  children,
  className,
}: {
  man: MatchMan;
  /** The row's own name group, so the trigger looks exactly like the row did.
   *  A card that opens from something other than what was tapped is the thing
   *  this arrangement exists to avoid. */
  children: React.ReactNode;
  className: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* A button rather than a link, because it goes nowhere. It keeps the
          row's own classes so the board looks unchanged until it is tapped. */}
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open ? <Card man={man} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function Card({ man, onClose }: { man: MatchMan; onClose: () => void }) {
  return (
    <Modal onClose={onClose} width="22rem">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-baseline gap-2">
          {man.position === null ? null : (
            <span className="numeric shrink-0 text-sm font-bold text-accent">{man.position}</span>
          )}
          <h2 className="min-w-0 flex-1 truncate font-chrome text-xl font-bold">
            {man.name}
            {man.captain ? <span className="ml-1.5 text-2xs text-faint">(c)</span> : null}
          </h2>
          {man.shirt === null ? null : (
            <span className="cm-index numeric flex size-8 shrink-0 items-center justify-center text-sm">
              {man.shirt}
            </span>
          )}
        </div>

        <p className="text-2xs text-faint">
          {man.club}
          {man.owner === null ? " · undrafted" : ` · ${man.owner}`}
        </p>

        {/* The figure the board is for, at the size a dialog can give it. */}
        <p className="flex items-baseline gap-2 border-y border-line py-2">
          <span className="numeric text-4xl font-bold text-info">
            {man.points === null ? "—" : man.points}
          </span>
          <span className="text-2xs text-faint">
            {man.points === null ? "never got on" : "points · FPL's own"}
          </span>
        </p>

        {man.marks.length === 0 ? null : (
          <p className="flex flex-wrap items-center gap-1">
            {man.marks.map((mark) => (
              <span
                key={mark.label}
                className={`rounded-[1px] px-1.5 py-0.5 text-2xs font-bold ${mark.className}`}
              >
                {mark.label}
              </span>
            ))}
          </p>
        )}

        <dl className="flex flex-col gap-1 text-sm">
          <Fact label="Named" value={man.bench ? "Substitute" : "Started"} />
          {man.onAt === null ? null : <Fact label="Came on" value={`${man.onAt}'`} />}
          {man.offAt === null ? null : (
            <Fact
              label={man.hurt ? "Off injured" : "Came off"}
              value={`${man.offAt}'`}
              tone={man.hurt ? "text-bad" : "text-ink"}
            />
          )}
          {man.booked === null ? null : <Fact label="Booked" value={`${man.booked}'`} />}
          {man.sentOff === null ? null : (
            <Fact label="Sent off" value={`${man.sentOff}'`} tone="text-bad" />
          )}
        </dl>

        <DialogFoot
          href={man.code === null ? null : `${PLAYER}/${man.code}`}
          label="His season"
          onClose={onClose}
        />
      </div>
    </Modal>
  );
}

/** One stated fact, in the shape DESIGN's density table calls a FACT. */
function Fact({
  label,
  value,
  tone = "text-ink",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-2xs font-bold uppercase text-faint">{label}</dt>
      <dd className={`numeric font-bold ${tone}`}>{value}</dd>
    </div>
  );
}
