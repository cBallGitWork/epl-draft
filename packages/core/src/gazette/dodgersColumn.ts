import { plural } from "../format";
import type { Dodger, NearMiss } from "./dodgers";
import { minutePhrases, numeral } from "./reports/minutes";

// The Points Dodgers, printed by the desk from the near misses: a sentence a man, no model (Craig, 1 Oct 2026, on cost).

/** Each miss as a fact, given its minutes in words; the headline takes the lead man's first in this order. */
const MISSED: Record<NearMiss["kind"], (whens: string[]) => string> = {
  "ruled-out": (whens) => (whens.length === 1 ? `goal ruled out ${whens[0]}` : `${numeral(whens.length)} goals ruled out`),
  "penalty-missed": (whens) => `penalty missed ${whens.join(" and another ")}`,
  "penalty-saved": (whens) => `penalty saved ${whens.join(" and another ")}`,
  "clean-sheet-lost": (whens) => `clean sheet lost to a goal ${whens[0]}`,
  woodwork: (whens) => (whens.length === 1 ? `hit the woodwork ${whens[0]}` : `hit the woodwork ${times(whens.length)}`),
  "set-up-woodwork": (whens) => `a shot he set up came back off the woodwork ${whens[0]}`,
};

const HEADLINE: Record<NearMiss["kind"], (name: string) => string> = {
  "ruled-out": (name) => `${name}'s Goal Ruled Out`,
  "penalty-missed": (name) => `${name} Misses From The Spot`,
  "penalty-saved": (name) => `${name}'s Penalty Saved`,
  "clean-sheet-lost": (name) => `${name}'s Clean Sheet Gone Late`,
  woodwork: (name) => `${name} Hits The Woodwork`,
  "set-up-woodwork": (name) => `${name} Denied An Assist By The Woodwork`,
};

/** The column a printed story files: headline, deck and a paragraph a man. Null with nobody to name. */
export function dodgersColumn(gameweek: number, dodgers: readonly Dodger[]): { headline: string; deck: string; body: string } | null {
  const lead = dodgers[0];
  if (lead === undefined) return null;
  return {
    headline: headline(lead),
    deck: `The ${numeral(dodgers.length)} who came closest to points in gameweek ${gameweek} and did not get them.`,
    body: dodgers.map(sentence).join("\n\n"),
  };
}

function headline(lead: Dodger): string {
  const kind = (Object.keys(HEADLINE) as NearMiss["kind"][]).find((each) => lead.misses.some((miss) => miss.kind === each));
  if (kind !== undefined) return HEADLINE[kind](lead.playerName);
  return lead.goals === 0 && lead.shots > 0 ? `${lead.playerName} Fires Blanks` : `${lead.playerName} Waits For An Assist`;
}

/** "Wissa (test3): penalty saved …; two shots, one on target." Semicolons part the facts, commas stay inside them. */
function sentence(man: Dodger): string {
  const facts = (Object.keys(MISSED) as NearMiss["kind"][]).flatMap((kind) => {
    const whens = man.misses.filter((miss) => miss.kind === kind).map((miss) => minutePhrases(miss.minute)[0] ?? "");
    return whens.length === 0 ? [] : [MISSED[kind](whens)];
  });
  if (man.goals === 0 && man.shots > 0) facts.push(shots(man));
  if (man.assists === 0 && man.chancesMade > 0) {
    const box = man.chancesInBox > 0 ? `, ${inBoxPhrase(man.chancesInBox, man.chancesMade)}` : "";
    facts.push(`set up ${counted(man.chancesMade, "shot")} for others${box}, no assist`);
  }
  if (man.goals > 0) facts.push("he did score");
  else if (man.assists > 0) facts.push("he did get an assist");
  else if (man.cleanSheet) facts.push("he did keep a clean sheet");
  return `${man.playerName} (${man.ownerName}): ${facts.join("; ")}.`;
}

function shots(man: Dodger): string {
  const box = man.inBox > 0 ? `, ${inBoxPhrase(man.inBox, man.shots)}` : "";
  const target = man.shots === 1 ? (man.onTarget === 1 ? "on target" : "off target") : `${man.onTarget === 0 ? "none" : numeral(man.onTarget)} on target`;
  return `${counted(man.shots, "shot")}${box}, ${target}`;
}

/** "all", "both" or "two from inside the box", or for one shot "from inside the box". */
function inBoxPhrase(inBox: number, of: number): string {
  if (of === 1) return "from inside the box";
  return `${inBox === of ? (of === 2 ? "both" : "all") : numeral(inBox)} from inside the box`;
}

const counted = (n: number, word: string) => `${numeral(n)} ${plural(n, word)}`;
const times = (n: number) => (n === 2 ? "twice" : `${numeral(n)} times`);
