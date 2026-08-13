import type { FootballPlayer } from "@epl/core";

// Whether he is fit, from the football layer.
//
// FPL's `news`, `status` and `chanceOfPlaying` are football facts about a real
// footballer, so they belong here rather than to whoever is running our league
// this season. Fantrax has its own injury notes and we ignore them: theirs
// arrive truncated mid-sentence.

export default function Availability({ player }: { player: FootballPlayer | null }) {
  // Silent for a fit player and for one the bridge has not settled. Both are
  // ordinary — the pool carries academy names FPL has never listed — and a panel
  // saying "no news" on every card is noise on seven hundred pages.
  if (player === null) return null;
  const flagged = player.status !== "a" || player.news !== "";
  if (!flagged) return null;

  return (
    <section
      className={`flex flex-col gap-0.5 rounded-lg border px-3 py-2 ${
        player.chanceOfPlaying === 0 ? "border-bad" : "border-mid"
      }`}
    >
      <h2 className="font-display text-2xs font-bold uppercase tracking-widest text-muted">
        {player.chanceOfPlaying === null
          ? "Doubt"
          : `${player.chanceOfPlaying}% chance of playing`}
      </h2>
      {player.news ? <p className="text-sm">{player.news}</p> : null}
    </section>
  );
}
