import Image from "next/image";
import ScrollBoard from "../../../components/league/ScrollBoard";
import type { Deal, DealSide } from "@epl/core";
import { crestForShortName, dealDay, inkOn, kindOf, movement, teamColours, toFplClubCode, DASH } from "@epl/core";
import { LABEL, PANEL_FLUSH, SMALL_CAPS } from "@/app/desk";

/** A name a step above `ROW_NAME`: a date, a type and two names are this screen's whole content (DESIGN §6). */
const NAME = "font-chrome text-base font-bold lg:text-lg";

/** A club crest, or the empty slot that keeps the names in line when there is none. */
const CREST = "size-5 shrink-0 object-contain lg:size-6";

// One manager's business, drawn as Championship Manager's Transfers screen.
//
// **`cm0102/23.jpg` and `cm9900/23.jpg` are the reference, and what they are is
// FIVE COLOUR-CODED COLUMNS** (Craig, 2 Sep: "not colourful enough", with the
// 01/02 shot attached). The game does not decorate that screen — it encodes it:
// a blue date block, the player in white, the club he left in YELLOW, where he
// went in ORANGE behind the word "to", and the fee on a purple ground. Five
// columns, five slots, and a reader can find the one he wants without reading
// any of the others. Our first cut had three columns and two of them were grey,
// which is why it read as a log rather than as this screen.
//
// The mapping into our own palette, which is stricter than CM's because every
// colour here is a slot with one meaning (DESIGN §3):
//
//   · the date block  → `cm-index`, CM's own blue index cell, unchanged
//   · who ARRIVED     → white, because a NAME IS WHITE in CM (`12.jpg`,
//                      `16.jpg`, `21.jpg`), and the pairing below carries the
//                      direction on its own
//   · who LEFT        → `--color-faint`, quiet, because he is gone
//   · the counterparty→ the other team's own colour, as a plate
//   · the kind        → a plate whose ink says claim from trade
//
// The fee column has no equivalent and is dropped rather than faked: a draft
// league has no money, and the period is what a manager actually knows a move
// by. That is the one place this screen deliberately parts from the shot.

export default function Ledger({
  deals,
  teamId,
  names,
}: {
  deals: readonly Deal[];
  teamId: string;
  /** Every team's name by id, so the partner plate can say WHO rather than
   *  restating the deal type. Read off the same payload the page already loads
   *  for its own name — never off the transaction row, which carries a name
   *  Fantrax copied at the time and does not update when a manager renames. */
  names: Record<string, string>;
}) {
  const rows = deals.map((deal) => ({ deal, ...movement(deal, teamId) }));
  // A claim is with nobody, so the With column is drawn only when a trade is listed.
  const traded = rows.some((row) => row.partners.length > 0);
  return (
    <section className={PANEL_FLUSH}>
      {/* The column heads, bevelled as one continuous run — `23.jpg` has no head
          row at all, but its columns are self-evident from the fee and the "to";
          ours are two lists of names facing each other and need saying. */}
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
                {/* The day, never cut: CM's blue date block ("Mon 23rd Aug" in `23.jpg`). */}
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

/** One side of a deal: the players, each with the position he plays.
 *
 *  **The position rides the name** (Craig, 2 Sep: "put the positions (D) in the
 *  transfers/trades too"), which is what `cm9900/12.jpg` does with its
 *  `Position` column and what a manager needs to read a swap — a defender for a
 *  forward is a different deal from a defender for a defender, and the names
 *  alone do not say which. Drawn quiet and in brackets so the NAME still leads
 *  the column; the reference sets its eligibility strings the same way, beside
 *  the name rather than over it. */
function Side({
  players,
  tone,
  label,
}: {
  players: DealSide[];
  tone: string;
  /** Printed only on a phone, where the head strip is hidden and the two lists
   *  are stacked — without it they are two lines of names with no way to tell
   *  which way the deal ran. */
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

/** The other side of a trade, as a plate in its own colour.
 *
 *  Fantrax sends a team NAME on every transaction row and we deliberately do not
 *  print it: a manager may rename his team and the row would then disagree with
 *  every other screen. The id is what the deal carries and what the colour table
 *  is keyed on, so the plate is drawn from the id and the name comes from
 *  nowhere — which is why this says the colour and not the name. */
function Partner({ teamId, name }: { teamId: string; name: string | undefined }) {
  const colours = teamColours(teamId);
  return (
    <span
      className={`block truncate px-1.5 py-0.5 text-center ${SMALL_CAPS}`}
      style={{ background: colours.primary, color: inkOn(colours) }}
    >
      {/* A team the league no longer lists — a manager who left mid-season —
          still has an id on the row, so the plate is drawn and says so rather
          than collapsing and losing the fact that somebody was there. */}
      {name ?? "Unknown"}
    </span>
  );
}
