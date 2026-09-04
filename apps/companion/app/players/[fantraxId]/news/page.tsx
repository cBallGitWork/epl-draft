import Nothing from "../../../components/shell/Nothing";
import { PANEL } from "@/app/desk";
import { availabilityOf } from "@epl/core";
import Availability from "../Availability";
import Story from "../Story";
import { playerStory } from "../dossier";
import Foot from "../Foot";
import NoProfile from "../NoProfile";
import PlayerShell from "../PlayerShell";
import { subject } from "../subject";

// Championship Manager's `Injuries & Bans`, under a name a manager would look
// for. CM's word is right in a game that suspends you for a fifth booking; ours
// answers the same question — can he play — and then says what is being said
// about him.
//
// **Two sources, and they are not the same claim.** FPL states availability: a
// status letter, a percentage, and a line of its own. Fantrax writes a report of
// his last match. A tab carrying only the first is half an answer for a fit man,
// which is why this was two tabs until 4 Sep 2026 and is now one (Craig:
// "Fitness could be doubled in with news").
//
// Still not read: Fantrax's `miscData.icons[]`, which carries the same kind of
// line truncated mid-sentence with an ellipsis. `sectionContent.OVERVIEW`'s
// `latestNews` is the same news arriving whole.

export const revalidate = 30;

export default async function PlayerNews({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  const found = await subject(fantraxId);
  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

  const { intel, football } = found;
  const player = football?.player ?? null;
  // **Asked of core, never re-derived here.** This read `news === "" &&
  // chanceOfPlaying === null` inline for one commit, beside a comment saying not
  // to — and it disagreed with core twice over. Core switches on `status` FIRST,
  // so a man carrying `i` with no news and no stated chance is INJURED to it and
  // was "Nothing reported" here: a confident wrong sentence on the one tab whose
  // whole job is whether he can play. `playerState.ts` is where the rule lives
  // because two readers disagreed once already.
  const fit = availabilityOf(player).state === "fit";

  return (
    <PlayerShell
      subject={found}
      fantraxId={fantraxId}
      current="news"
    >
      {player === null ? (
        <section className={PANEL}>
          <Nothing title="Nothing on his fitness">
            FPL has never listed him, and FPL is where availability comes from.
          </Nothing>
        </section>
      ) : fit ? (
        // Silence is the answer for a fit man, and it is stated rather than
        // drawn as an empty panel — DESIGN §7's rule that absence is a dash
        // applies to a figure; a state needs a sentence.
        <section className={PANEL}>
          <p className="text-sm text-muted">
            Nothing reported. FPL has no news on him and no doubt over the next round.
          </p>
        </section>
      ) : (
        <Availability player={player} />
      )}

      {/* Fantrax's own report on him — whole, with its analysis. A different
          question from the availability above: that is whether he can play, this
          is what is being said. Its own heading for that reason (DESIGN §7). */}
      <Story story={await playerStory(fantraxId)} />

      <Foot ownerTeamId={intel.ownerTeamId} />
    </PlayerShell>
  );
}
