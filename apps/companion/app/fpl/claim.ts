import { wholeNumber } from "../wholeNumber";

/** What Save answers for a typed FPL id: the id to keep, or why not. `known` is FPL's verdict on it. */
export async function claim(
  typed: string,
  known: (id: number) => Promise<boolean>,
): Promise<{ id: number } | { refusal: string }> {
  const id = wholeNumber(typed.trim());
  if (id === null) return { refusal: "That is not an FPL team id." };
  let found: boolean;
  try {
    found = await known(id);
  } catch {
    return { refusal: "FPL did not answer. Try again in a minute." };
  }
  return found ? { id } : { refusal: `FPL has no team ${id}.` };
}
