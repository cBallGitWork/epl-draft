import type { FootballPlayer } from "./types";

// Whether a man can be picked, and why not, from FPL's five status letters; Fantrax's injury notes arrive truncated.

export type PlayerState = "fit" | "doubt" | "injured" | "suspended" | "unavailable";

export interface Availability {
  state: PlayerState;
  /** The word in the box; empty for a fit player, who gets no box. */
  label: string;
  /** He is definitely not playing: the box fills and the row greys, unlike a doubt. */
  out: boolean;
  /** 0–100, or null when FPL has no opinion; null is not zero. */
  chance: number | null;
  /** FPL's own words, untruncated; never paraphrased. */
  news: string;
}

const FIT: Availability = { state: "fit", label: "", out: false, chance: null, news: "" };

/** The one rule for "is he fine": 100% with no news is fit, and so is no letter, news or chance at all. */
export function availabilityOf(player: Pick<FootballPlayer, "status" | "news" | "chanceOfPlaying"> | null): Availability {
  // Null is a man the bridge has not settled, which is ordinary: silence, not a doubt.
  if (player === null) return FIT;
  if (player.news === "" && player.chanceOfPlaying === 100) return FIT;

  const rest = { chance: player.chanceOfPlaying, news: player.news };
  // A stated nought sets `out` under any letter; the word stays the letter's.
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
      // Available by letter but carrying news or a chance: a knock that has not become a status, so a doubt.
      if (player.news === "" && player.chanceOfPlaying === null) return FIT;
      return { state: "doubt", label: "Dbt", out: nought, ...rest };
  }
}

/** Whether he carries any doubt at all. */
export function isDoubtful(player: FootballPlayer): boolean {
  return availabilityOf(player).state !== "fit";
}

/** Whether he is still on a Premier League club's books: FPL's `u` means he has left, so he drops off every list.
 *  A rule about lists, not the record: a match page or a roster slot still shows him, greyed. */
export function onTheBooks(player: FootballPlayer): boolean {
  return availabilityOf(player).state !== "unavailable";
}

/** How badly a doubt reads on a pitch: out, major (25% or less) or slight, including a doubt with no number; null if fit.
 *  FPL publishes the chance only as 0, 25, 50, 75 or 100. */
export type DoubtBand = "out" | "major" | "slight";

const MAJOR = 25;

export function doubtBand(availability: Availability): DoubtBand | null {
  if (availability.state === "fit") return null;
  if (availability.out) return "out";
  return availability.chance !== null && availability.chance <= MAJOR ? "major" : "slight";
}
