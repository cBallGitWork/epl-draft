import Image from "next/image";
import ScrollBoard from "../../../components/league/ScrollBoard";
import type { Deal, DealSide } from "@epl/core";
import { crestForShortName, dealDay, inkOn, kindOf, movement, teamColours, toFplClubCode, DASH } from "@epl/core";
import { LABEL, PANEL_FLUSH, SMALL_CAPS } from "@/app/desk";

// One manager's business as CM's Transfers screen (`cm0102/23.jpg`): a blue date block, the type in
// yellow, who came in white, who went out faint, and a trade's partner on his own colour.

/** A name a step above `ROW_NAME`: a date, a type and two names are this screen's whole content (DESIGN §6). */
const NAME = "font-chrome text-base font-bold lg:text-lg";

/** A club crest, or the empty slot that keeps the names in line when there is none. */
const CREST = "size-5 shrink-0 object-contain lg:size-6";

export default function Ledger({
  deals,
  teamId,
  names,
}: {
  deals: readonly Deal[];
  teamId: string;
  /** Every team's name by id; the transaction row's own copy goes stale when a manager renames. */
  names: Record<string, string>;
}) {
  const rows = deals.map((deal) => ({ deal, ...movement(deal, teamId) }));
  // A claim is with nobody, so the With column is drawn only when a trade is listed.
  const traded = rows.some((row) => row.partners.length > 0);
  return (
    <section className={PANEL_FLUSH}>
      <div className={`cm-bevel hidden min-h-7 items-center gap-2 px-1.5 ${SMALL_CAPS} lg:flex`}>
        <span className="w-24 shrink-0">Date</span>
        <span className="w-24 shrink-0">Type</span>
        <span className="min-w-0 flex-1">In</span>
        <span className="min-w-0 flex-1">Out</span>
        {traded ? <span className="w-32 shrink-0">With</span> : null}
      </div>

      <ScrollBoard>
        <ul className="cm-rows flex flex-col">
          {rows.map(({ deal, in: arrived, out: left, partners }) => (
            // One row at both widths: a phone stacks date over type and In over Out inside it.
            <li
              key={deal.setId || `${deal.processedAt}-${deal.period}`}
              className="cm-row flex min-h-14 items-center gap-2 px-1.5 py-1.5"
            >
              <span className="flex w-24 shrink-0 flex-col gap-1 lg:contents">
                {/* The day, never cut. */}
                <span className="cm-index numeric w-24 shrink-0 whitespace-nowrap px-1.5 py-0.5">
                  {dealDay(deal.processedAt)}
                </span>
                <span className={`w-24 shrink-0 ${SMALL_CAPS} text-accent lg:text-sm`}>
                  {kindOf(deal, arrived.length, left.length)}
                </span>
                {/* Who he traded with: under the type on a phone, the last column on a desk. */}
                {traded ? (
                  <span className={`shrink-0 lg:order-last lg:w-32 ${partners.length === 0 ? "hidden lg:block" : ""}`}>
                    {partners.length === 0 ? null : (
                      <span className="flex flex-col items-stretch gap-0.5">
                        <Partner teamId={partners[0]} name={names[partners[0]]} />
                        {partners.length > 1 ? (
                          <span className="text-center text-2xs text-faint">+{partners.length - 1}</span>
                        ) : null}
                      </span>
                    )}
                  </span>
                ) : null}
              </span>

              {/* Both sides always drawn, so a claim's empty side is a dash rather than a reflow. */}
              <span className="flex min-w-0 flex-1 flex-col gap-1 lg:contents">
                <Side players={arrived} tone="text-ink" label="In" />
                <Side players={left} tone="text-faint" label="Out" />
              </span>
            </li>
          ))}
        </ul>
      </ScrollBoard>
    </section>
  );
}

/** One side of a deal: each man's club crest, name and position (a defender for a forward is a different deal). */
function Side({
  players,
  tone,
  label,
}: {
  players: DealSide[];
  tone: string;
  /** "In" or "Out", printed only on a phone, where the head strip is hidden. */
  label: string;
}) {
  return (
    <span className={`flex min-w-0 flex-1 items-center gap-1.5 ${tone}`}>
      <span className={`w-7 shrink-0 ${LABEL} lg:hidden`}>{label}</span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        {players.length === 0 ? (
          <span className={`flex items-center gap-1.5 ${NAME}`}>
            <span className={CREST} />
            {DASH}
          </span>
        ) : (
          players.map((player) => {
            // His real club as its crest; an unknown club leaves the slot empty rather than guess.
            const crest = player.club ? crestForShortName(toFplClubCode(player.club)) : null;
            return (
              <span key={player.playerName} className={`flex min-w-0 items-center gap-1.5 ${NAME}`}>
                {crest ? (
                  <Image src={crest} alt={player.clubName ?? player.club ?? ""} width={24} height={24} className={CREST} />
                ) : (
                  <span className={CREST} />
                )}
                <span className="truncate">{player.playerName}</span>
                {player.position ? (
                  <span className="shrink-0 text-2xs font-bold text-mid lg:text-xs">({player.position})</span>
                ) : null}
              </span>
            );
          })
        )}
      </span>
    </span>
  );
}

/** The other side of a trade, as a plate in his own colour, keyed on the id the deal carries. */
function Partner({ teamId, name }: { teamId: string; name: string | undefined }) {
  const colours = teamColours(teamId);
  return (
    <span
      className={`block truncate px-1.5 py-0.5 text-center ${SMALL_CAPS}`}
      style={{ background: colours.primary, color: inkOn(colours) }}
    >
      {/* A manager who has left the league still has an id on the row. */}
      {name ?? "Unknown"}
    </span>
  );
}
