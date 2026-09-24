import type { PlayerOwner } from "@epl/core";

// The league team holding a man, in brackets after his name — a gloss on the name, so quieter and a step under it.

/** Row size beside a board's name; the scoresheet's own larger names take `scoresheet`. */
const SIZE = { row: "lg:text-xs", scoresheet: "lg:text-base" } as const;

export default function OwnedBy({
  owner,
  size = "row",
  className = "",
}: {
  owner: PlayerOwner | undefined;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  if (owner === undefined) return null;
  return <span className={`text-2xs font-normal text-faint ${SIZE[size]} ${className}`}>({owner.teamName})</span>;
}
