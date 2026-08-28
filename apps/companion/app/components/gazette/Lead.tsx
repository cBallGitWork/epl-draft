import type { LeadResult, Lead as Story } from "@epl/core";

// The lead story: the one thing on the page set to be read from across a room.
//
// Deliberately not a `Column`, though it borrows that head. A column's head is a
// label over a list and the list is the point; here the head is a kicker and the
// HEADLINE is the point, so the headline has to be the heading and the kicker is
// the small type above the rule. Same ink, same register, different job.
//
// The words are here and the facts are in `gazette/lead.ts`, on the split the
// rest of the paper keeps. Nothing below decides which story is the biggest —
// it decides how to say the one that is.
//
// Unmarked when it is about the reader's own team, and that is a choice: the
// accent is a reading aid for scanning a list of sixteen, and there is nothing
// to scan here. A manager knows his own name in a headline.

export default function Lead({
  lead,
  who,
}: {
  lead: Story;
  who: (teamId: string | null) => string;
}) {
  const { kicker, headline, standfirst } = written(lead, who);

  return (
    <section className="flex flex-col">
      <p className="border-b border-league/40 pb-1 font-display text-xs font-bold uppercase tracking-widest text-cream">
        {kicker}
      </p>
      <h2 className="text-balance pt-2.5 font-display text-2xl font-bold leading-[1.1] tracking-tight text-cream">
        {headline}
      </h2>
      <p className="pt-1.5 text-sm leading-snug text-muted">{standfirst}</p>
    </section>
  );
}

/** The paper's words for one story.
 *
 *  Every sentence below is true of every story of its kind, which is the whole
 *  constraint: a standfirst is written once and printed over thirty-eight weeks
 *  of facts nobody has seen yet, so it may not claim anything the fact does not
 *  carry. "Took him apart" is the verb doing the colouring; the numbers beside
 *  it are Fantrax's, verbatim. */
function written(lead: Story, who: (teamId: string | null) => string) {
  switch (lead.kind) {
    case "squeaker":
      return {
        kicker: "Down to the wire",
        headline: `${lead.result.winner.name} edged ${lead.result.loser.name}`,
        standfirst: `${scoreline(lead.result)} ${points(lead.result.margin)} in it.`,
      };
    case "bench":
      return {
        kicker: "Left out",
        headline: `${lead.pick.ownerName} left ${lead.pick.playerName} out`,
        // The owner is named once, off the pick, so the headline and the line
        // under it cannot end up calling one manager two things: his name
        // reaches `lost.loser` through `getLeagueInfo` and reaches the pick
        // through the roster, and those are two reads of one team.
        standfirst:
          lead.lost === null
            ? "He is in the week's eleven, picked by everybody except his own manager."
            : `He is in the week's eleven. ${lead.pick.ownerName} lost ` +
              `${lead.lost.loser.points}–${lead.lost.winner.points} to ${lead.lost.winner.name}.`,
      };
    case "rout":
      return {
        kicker: "No contest",
        headline: `${lead.result.winner.name} took ${lead.result.loser.name} apart`,
        standfirst: `${scoreline(lead.result)} ${points(lead.result.margin)} between them.`,
      };
    case "trade":
      return {
        kicker: "Business",
        headline: `${lead.sides.map(who).join(" and ")} have traded`,
        standfirst: lead.deal.inbound
          .map((player) => `${player.playerName} to ${who(player.teamId)}`)
          .join(" · "),
      };
  }
}

/** Winner first, as the headline names them. Fantrax's own totals, unrounded and
 *  unconverted — every other screen prints them exactly this way. */
function scoreline(result: LeadResult): string {
  return `${result.winner.points}–${result.loser.points}.`;
}

function points(margin: number): string {
  return `${margin} point${margin === 1 ? "" : "s"}`;
}
