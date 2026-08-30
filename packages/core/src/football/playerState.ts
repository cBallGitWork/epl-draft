import type { FootballPlayer } from "./types";

// Whether a man can be picked, and why not. Pure.
//
// FPL publishes five status letters — `a` available, `i` injured, `s` suspended,
// `d` doubtful, `u` unavailable — and until now the app collapsed all of them to
// a boolean and drew the answer as a border colour. They are the five states
// Championship Manager put in a box beside a name, and the letter has been on
// every resolved roster slot the whole time.
//
// Fantrax has its own injury notes and we ignore them: theirs arrive truncated
// mid-sentence. This is a football fact about a real footballer, so it belongs
// to the football layer rather than to whoever is running our league this season.

export type PlayerState = "fit" | "doubt" | "injured" | "suspended" | "unavailable";

export interface Availability {
  state: PlayerState;
  /** The word in the box. Empty for a fit player, who gets no box on a row. */
  label: string;
  /** He is definitely not playing. The box fills rather than outlines, and the
   *  row greys — which is a different statement from a doubt, where the row
   *  stays at full strength because he might yet play. */
  out: boolean;
  chance: number | null;
  news: string;
}

const FIT: Availability = { state: "fit", label: "", out: false, chance: null, news: "" };

/** The one rule for "is he fine", which two readers used to answer differently —
 *  the paper's doubts column counted a stated chance of playing and the player
 *  card did not, so the same footballer was a doubt on one tab and fit on the
 *  next.
 *
 *  A hundred percent with nothing written against it is FPL saying he is fine,
 *  and it is the one combination carrying a number that is not a doubt. */
export function availabilityOf(player: FootballPlayer | null): Availability {
  // Null is the bridge not having settled him, which is ordinary — the pool
  // carries academy names FPL has never listed. Silence, not a doubt.
  if (player === null) return FIT;
  if (player.news === "" && player.chanceOfPlaying === 100) return FIT;

  const rest = { chance: player.chanceOfPlaying, news: player.news };
  // A stated nought is not a doubt, whatever letter it arrives under: FPL is
  // saying he will not play, and a row still reading at full strength would be
  // the screen disagreeing with itself. It sets `out`, not the word — the word
  // is the letter's, and "why not" is the question the box answers.
  const nought = player.chanceOfPlaying === 0;

  switch (player.status) {
    case "i":
      return { state: "injured", label: "Inj", out: true, ...rest };
    case "s":
      return { state: "suspended", label: "Sus", out: true, ...rest };
    case "u":
      return { state: "unavailable", label: "Unav", out: true, ...rest };
    case "d":
      return { state: "doubt", label: "Dbt", out: nought, ...rest };
    default:
      // Available by letter, but carrying news or a chance. FPL does this for a
      // knock that has not become a status, and it is the commonest doubt there
      // is — so it is a doubt rather than fit.
      if (player.news === "" && player.chanceOfPlaying === null) return FIT;
      return { state: "doubt", label: "Dbt", out: nought, ...rest };
  }
}

/** Kept as the question five call sites actually ask, now with one definition
 *  behind it rather than a second copy of the rule. */
export function isDoubtful(player: FootballPlayer): boolean {
  return availabilityOf(player).state !== "fit";
}
