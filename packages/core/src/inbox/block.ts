import { listed } from "../format";
import type { BlockPlayer, TradeBlock } from "../league/types";
import { NAMES_IN_HEADLINE } from "./messages";
import type { InboxItem } from "./types";

// The trade block, as the transfer desk would put it: who has been transfer-listed, who is in the market for what.
// One letter per team's block, dated by its last save, so a change reaches every manager's mail as new.

/** `Erling Haaland (MCI)`, for a headline. */
function named(man: BlockPlayer): string {
  return man.club ? `${man.playerName} (${man.club})` : man.playerName;
}

/** `Manchester City's Erling Haaland`, for a letter. */
function spoken(man: BlockPlayer): string {
  return man.clubName ? `${man.clubName}'s ${man.playerName}` : named(man);
}

/** "Defender" as a letter says it: `a defender`. Two: so `notes.ts`'s copy stays. */
function aPosition(name: string): string {
  const said = name.toLowerCase();
  return `${/^[aeiou]/.test(said) ? "an" : "a"} ${said}`;
}

export function blockNews(
  blocks: readonly TradeBlock[],
  {
    name,
    mine,
    holder,
  }: {
    /** A team's name, or null for an id the league no longer describes. */
    name: (teamId: string) => string | null;
    /** The reader's team, whose block is written to him as his; null when signed out. */
    mine: string | null;
    /** The team holding a footballer, so a man wanted off the reader reads as his. */
    holder: (fantraxId: string) => string | null;
  },
): InboxItem[] {
  return blocks.map((block) => {
    const yours = block.teamId === mine;
    const who = yours ? "You" : (name(block.teamId) ?? "A manager");
    const wantedMan = (man: BlockPlayer) =>
      mine !== null && !yours && holder(man.fantraxId) === mine ? `your ${man.playerName}` : spoken(man);
    return {
      id: `block:${block.teamId}:${block.updatedAt ?? "undated"}`,
      category: "message" as const,
      at: block.updatedAt,
      gameweek: null,
      headline: headline(block, who),
      body: letter(block, yours, wantedMan),
      from: "The transfer desk",
      about: null,
      teamId: block.teamId,
      mark: null,
      // The market is news, never bad news.
      urgent: false,
    };
  });
}

/** The block's lead, in the order a reader cares: who is for sale, then what they are after. */
function headline(block: TradeBlock, who: string): string {
  const first = (men: readonly BlockPlayer[]) => listed(men.slice(0, NAMES_IN_HEADLINE).map(named));
  if (block.offered.length > 0) return `${who} transfer-list ${first(block.offered)}`;
  if (block.positionsWanted.length > 0) return `${who} are in the market for ${listed(block.positionsWanted.map(aPosition))}`;
  if (block.wanted.length > 0) return `${who} are interested in ${first(block.wanted)}`;
  if (block.positionsOffered.length > 0) return `${who} will listen to offers for ${listed(block.positionsOffered.map(aPosition))}`;
  return `${who} post on the trade block`;
}

/** Every part of the block as a sentence, the manager's own note last and verbatim. */
function letter(block: TradeBlock, yours: boolean, wantedMan: (man: BlockPlayer) => string): string {
  const [they, their] = yours ? ["You're", "Your"] : ["They're", "Their"];
  const sentences: string[] = [];
  if (block.offered.length > 0) {
    const men = block.offered.map(spoken);
    sentences.push(`${listed(men)} ${men.length === 1 ? "has" : "have"} been put on the transfer list.`);
  }
  if (block.positionsWanted.length > 0) {
    sentences.push(`${they} in the market for ${listed(block.positionsWanted.map(aPosition))}.`);
  }
  if (block.wanted.length > 0) sentences.push(`${they} interested in ${listed(block.wanted.map(wantedMan))}.`);
  if (block.positionsOffered.length > 0) {
    sentences.push(`${yours ? "You'll" : "They'll"} listen to offers for ${listed(block.positionsOffered.map(aPosition))}.`);
  }
  if (block.comment !== null) sentences.push(`${their} note: "${block.comment}"`);
  return sentences.join(" ");
}
