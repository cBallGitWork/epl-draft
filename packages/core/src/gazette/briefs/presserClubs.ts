import type { PresserQuote } from "../../football/intel/pressers";
import { normalizeName } from "../../identity/normalize";
import type { PresserLine } from "./presser";

// One day's team news by club: what the brief sets out and what the sub-editor then expects to see printed.

export type ClubQuote = PresserQuote & { clubName: string };

/** A timescale, a decision, a reason or a man's availability: what earns a manager's words a place in print. */
const FACT =
  /\b(?:days?|weeks?|months?|tomorrow|tonight|weekend|(?:mon|tues|wednes|thurs|fri|satur|sun)day|november|december|january|international break|decided?|decision|scan|mri|surgery|operation|assess\w*|available|unavailable|ready|fit|out|miss|won[’']t|will not|involved|trained|training|injur\w*|back|return\w*|recover\w*|ban|suspend\w*|protocol)\b/iu;

export const carriesFact = (text: string): boolean => FACT.test(text);

/** A standing absence: out, and nothing new said about it. Neither a bullet nor still out is a standing doubt. */
const ABSENT: ReadonlySet<string> = new Set(["ruled_out", "suspended"]);
export const stillOut = (line: PresserLine) => !line.fresh && ABSENT.has(line.tag);

export interface PresserClub {
  name: string;
  code: number;
  /** The men whose availability changed: a bullet each. */
  men: PresserLine[];
  standing: PresserLine[];
  /** The ones carrying a fact first, otherwise as said. */
  quotes: { quote: ClubQuote; fact: boolean }[];
  /** The men a quote names, by any word of four letters or more of his name or its subject. */
  named: Set<string>;
}

const words = (text: string) => new Set(normalizeName(text).split(" "));

function namedIn(man: string, quotes: readonly ClubQuote[]): boolean {
  const said = quotes.map((quote) => words(`${quote.text} ${quote.about ?? ""}`));
  return [...words(man)].some((word) => word.length >= 4 && said.some((each) => each.has(word)));
}

/** The day's lines and quotes by club, in the order the lines arrive, then the clubs that only spoke. */
export function presserClubs(lines: readonly PresserLine[], quotes: readonly ClubQuote[]): PresserClub[] {
  const byName = new Map<string, { code: number; lines: PresserLine[]; quotes: ClubQuote[] }>();
  const row = (name: string, code: number) => {
    const held = byName.get(name) ?? { code, lines: [], quotes: [] };
    byName.set(name, held);
    return held;
  };
  for (const line of lines) row(line.clubName, line.club).lines.push(line);
  for (const quote of quotes) row(quote.clubName, quote.club).quotes.push(quote);

  return [...byName.entries()].map(([name, club]) => {
    const marked = club.quotes.map((quote) => ({ quote, fact: carriesFact(quote.text) }));
    const men = club.lines.filter((line) => line.fresh);
    return {
      name,
      code: club.code,
      men,
      standing: club.lines.filter(stillOut),
      quotes: [...marked.filter((each) => each.fact), ...marked.filter((each) => !each.fact)],
      named: new Set(men.map((man) => man.playerName).filter((man) => namedIn(man, club.quotes))),
    };
  });
}

/** What the filed Team Sheet must carry, checked by `teamSheetGaps`. */
export interface TeamSheetExpect {
  /** Clubs with a bullet or a quote with a fact: each needs a line. */
  reported: { code: number; club: string }[];
  /** Clubs offered a quote with a fact: each prints one. */
  quoted: { code: number; club: string }[];
  /** Men given a complaint or named in a quote: each needs a note. */
  noted: string[];
}

export function teamSheetExpect(clubs: readonly PresserClub[]): TeamSheetExpect {
  const id = (club: PresserClub) => ({ code: club.code, club: club.name });
  const quoted = clubs.filter((club) => club.quotes.some((each) => each.fact));
  return {
    reported: clubs.filter((club) => club.men.length > 0 || quoted.includes(club)).map(id),
    quoted: quoted.map(id),
    noted: clubs.flatMap((club) =>
      club.men.filter((man) => (man.condition ?? "") !== "" || club.named.has(man.playerName)).map((man) => man.playerName),
    ),
  };
}
