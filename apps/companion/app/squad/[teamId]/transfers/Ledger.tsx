import type { Deal, DealSide } from "@epl/core";
import { inkOn, kindOf, movement, teamColours } from "@epl/core";
import { PANEL_FLUSH, SCROLL } from "@/app/desk";

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
  return (
    <section className={PANEL_FLUSH}>
      {/* The column heads, bevelled as one continuous run — `23.jpg` has no head
          row at all, but its columns are self-evident from the fee and the "to";
          ours are two lists of names facing each other and need saying. */}
      <div className="cm-bevel hidden min-h-7 items-center gap-2 px-1.5 text-3xs font-bold uppercase lg:flex">
        <span className="w-24 shrink-0">Date</span>
        <span className="w-20 shrink-0">Type</span>
        <span className="min-w-0 flex-1">In</span>
        <span className="min-w-0 flex-1">Out</span>
        <span className="w-16 shrink-0">With</span>
      </div>

      <div className={SCROLL}>
        <ul className="cm-rows flex flex-col">
          {deals.map((deal) => {
            const { in: arrived, out: left, partners } = movement(deal, teamId);
            return (
              <li
                key={deal.setId || `${deal.processedAt}-${deal.period}`}
                // **Stacked on a phone, five columns on the desk.** Five
                // columns inside 390 truncated both names to "Da…" and "Ma…",
                // which is a ledger you cannot read — and the two names are the
                // entire content. So the phone gets the deal as a small block:
                // date and type on one line, then who came in and who went out
                // under it. `conventions.md` already carries this pattern for a
                // two-line row; this is the same rule at row scale.
                className="cm-row flex min-h-11 flex-col gap-1 px-1.5 py-1.5 lg:flex-row lg:items-center lg:gap-2 lg:py-0"
              >
                {/* CM's leading index cell carrying the DATE — `23.jpg` runs
                    "Mon 23rd Aug" down the left in exactly this blue block.
                    Fantrax's string verbatim: it has no offset in it, so it is
                    printed as they wrote it and the zone is named once in the
                    header rather than guessed at per row. */}
                {/* **The date, not the timestamp.** Fantrax sends
                    "Wed Sep 2, 2026, 6:11AM" — 23 characters, which at 390 took
                    a third of the row and pushed the OUT and WITH columns off
                    the screen entirely. `23.jpg`'s block is "Mon 23rd Aug": day
                    and month, no year, no clock. The year is on every row and
                    says nothing; the minute is a precision a waiver ledger has
                    no use for. Trimmed by splitting on Fantrax's own commas
                    rather than parsed — their string carries no offset, so
                    turning it into a Date would invent one. */}
                <span className="flex items-center gap-2 lg:contents">
                <span className="cm-index numeric w-24 shrink-0 truncate px-1.5 py-0.5 text-3xs font-bold">
                  {shortDate(deal.processedAt)}
                </span>

                {/* Type and period ride together in one narrow cell rather than
                    owning a column each: at 390 the row has room for four
                    columns and the two facing name lists must have most of it.
                    The kind takes the accent because it is the one word that
                    says what KIND of business this was. */}
                {/* The period came off (Craig, 2 Sep: "remove P3 in type"). It
                    was a second number under a word, and the date above already
                    says when — a period is how the league counts a week, not how a
                    reader dates a transfer. */}
                <span className="w-20 shrink-0 text-3xs font-bold uppercase text-accent">
                  {kindOf(deal, arrived.length, left.length)}
                </span>
                </span>

                {/* **Two facing columns, and both are always drawn.** A claim
                    that cost nobody and a straight drop each leave one side
                    empty, and a row that reflows when a side is missing stops
                    being scannable — which is the whole point of a ledger.
                    Absence is an em dash (DESIGN §7). */}
                <Side players={arrived} tone="text-ink" label="In" />
                <Side players={left} tone="text-faint" label="Out" />

                {/* Who he dealt with, on that team's own colour — the same plate
                    the Match screen gives a side, because this is the other
                    place in the app where two teams meet. A claim came off the
                    pool, which is not a team and gets no plate. */}
                <span className="w-16 shrink-0 self-start lg:self-auto">
                  {partners.length === 0 ? (
                    /* **"The Bin", which is what this league calls the free
                        pool** (Craig, 2 Sep). Fantrax says "free agent" and CM
                        would say whatever the game says — the point of naming a
                        thing is that the people using it recognise it, and ten
                        managers who have said "the bin" for years do not
                        recognise "free agent" as the same place. */
                    <span className="block truncate border border-line px-1.5 py-0.5 text-center text-3xs font-bold uppercase text-faint">
                      The Bin
                    </span>
                  ) : (
                    /* One plate, and a count when there is more than one team on
                        the deal. A three-way trade named only the first partner
                        and read as a straight swap with him — `movement` returns
                        the whole list now, so the truncation is this view's and
                        it says so rather than hiding it. */
                    <span className="flex flex-col items-stretch gap-0.5">
                      <Partner teamId={partners[0]} name={names[partners[0]]} />
                      {partners.length > 1 ? (
                        <span className="text-center text-3xs text-faint">
                          +{partners.length - 1}
                        </span>
                      ) : null}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
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
    <span className={`flex min-w-0 flex-1 items-baseline gap-1.5 lg:block ${tone}`}>
      <span className="w-6 shrink-0 text-3xs font-bold uppercase text-faint lg:hidden">
        {label}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center leading-tight">
      {players.length === 0 ? (
        <span className="truncate text-sm">—</span>
      ) : (
        players.map((player) => (
          <span key={player.playerName} className="truncate text-sm font-medium">
            {player.playerName}
            {player.position ? (
              <span className="pl-1 text-3xs font-bold text-mid">({player.position})</span>
            ) : null}
            {/* His real club (Craig, 2 Sep: "let's put the club team in here
                too"). `23.jpg` prints the club he came FROM in yellow beside
                every name, which is the same fact — a reader knows a signing by
                who he plays for as much as by his name. Quiet rather than
                yellow because the position beside it already has the amber and
                two amber strings on one line is neither of them emphasised. */}
            {player.club ? (
              <span className="numeric pl-1 text-3xs text-faint">{player.club}</span>
            ) : null}
          </span>
        ))
      )}
      </span>
    </span>
  );
}

/** Fantrax's timestamp, trimmed to the day. Their own commas do the work: the
 *  string is "Wed Sep 2, 2026, 6:11AM" and the first two segments are the date.
 *  Never parsed into a `Date` — it carries no offset, so parsing invents one. */
function shortDate(at: string | null): string {
  if (at === null) return "—";
  const [day, month] = at.split(",");
  return month === undefined ? at : `${day.trim()} ${month.trim()}`;
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
      className="block truncate px-1.5 py-0.5 text-center text-3xs font-bold uppercase"
      style={{ background: colours.primary, color: inkOn(colours) }}
    >
      {/* A team the league no longer lists — a manager who left mid-season —
          still has an id on the row, so the plate is drawn and says so rather
          than collapsing and losing the fact that somebody was there. */}
      {name ?? "Unknown"}
    </span>
  );
}
