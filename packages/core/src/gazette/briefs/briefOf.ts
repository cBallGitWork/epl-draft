/** A brief's blocks, a blank line between, a block with nothing to say left out. */
export const briefOf = (blocks: readonly (string | null)[]): string => blocks.filter((block) => block !== null).join("\n\n");
