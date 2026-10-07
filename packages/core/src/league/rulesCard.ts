import { DASH } from "../format";
import { wordsOf } from "./categoryWords";
import { priceOf, type Price, type ScoringRules, type LeagueScoring } from "./scoring";
import { signed } from "./signed";

// The league's scoring as a card a manager reads: a line per category in plain words, priced per roster slot.

/** One category on the card: its words, and its price at each slot as lines of text. */
interface RuleLine {
  name: string;
  key: string;
  /** One entry per slot asked for; a banded price is several lines. */
  prices: string[][];
  /** Every slot is priced alike, so the card prints it once. */
  same: boolean;
}

/** The slots the rules price: the keeper's letter and every outfield letter a row names, never `Default`. */
export function scoredSlots(rules: ScoringRules): string[] {
  const named = Object.values(rules.outfield).flatMap((row) => Object.keys(row));
  const outfield = [...new Set(named)].filter((slot) => slot !== DEFAULT && slot !== rules.goaliePosition);
  return rules.goaliePosition === null ? outfield : [rules.goaliePosition, ...outfield];
}

/** Every category that pays some slot something, rewards before costs, one line per meaning (GA and GAO are one). */
export function rulesCard(scoring: LeagueScoring, slots: readonly string[]): RuleLine[] {
  const { rules, categories } = scoring;
  const byName = new Map<string, { key: string; prices: (Price | null)[] }>();
  for (const code of new Set([...Object.keys(rules.goalie), ...Object.keys(rules.outfield)])) {
    const prices = slots.map((slot) => priceOf(rules, code, slot));
    if (prices.every((price) => !pays(price))) continue;
    const category = Object.values(categories).find((entry) => entry.code === code);
    const words = category === undefined ? { name: code, key: code } : wordsOf(category);
    const held = byName.get(words.name);
    byName.set(words.name, {
      key: held?.key ?? words.key,
      prices: prices.map((price, at) => (pays(held?.prices[at] ?? null) ? (held?.prices[at] ?? null) : price)),
    });
  }
  const lines = [...byName].map(([name, { key, prices }]) => {
    const written = prices.map(priceWords);
    const same = written.every((cell) => cell.join() === written[0]?.join());
    return { line: { name, key, prices: written, same }, cost: costs(prices) };
  });
  return [...lines.filter((entry) => !entry.cost), ...lines.filter((entry) => entry.cost)].map((entry) => entry.line);
}

const DEFAULT = "Default";

function pays(price: Price | null): boolean {
  return price !== null && (typeof price === "number" ? price !== 0 : price.bands.some((band) => band.points !== 0));
}

/** True when every price that pays takes points away. */
function costs(prices: readonly (Price | null)[]): boolean {
  const points = prices.flatMap((price) => (price === null ? [] : typeof price === "number" ? [price] : price.bands.map((b) => b.points)));
  return points.filter((p) => p !== 0).every((p) => p < 0);
}

/** "+6"; "1–59: +1", "60+: +2" for bands, the top one open; "-1 per 2" for a count that pays every so many. */
function priceWords(price: Price | null): string[] {
  if (!pays(price) || price === null) return [DASH];
  if (typeof price === "number") return [signed(price)];
  const last = price.bands.length - 1;
  return price.bands.map((band, at) => {
    if (band.every !== null) return `${signed(band.points)} per ${band.every}`;
    return `${at === last ? `${band.from}+` : `${band.from}–${band.to}`}: ${signed(band.points)}`;
  });
}
