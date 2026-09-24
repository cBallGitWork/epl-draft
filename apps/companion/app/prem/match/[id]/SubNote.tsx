import type { PlManMatch } from "@epl/core";

/** `sub on 64'`, `sub off 71' inj`, or both, in CM's amber — `cm9900/02.jpg`'s `in 77` / `ut 77`. */
export default function SubNote({
  did,
  hurt,
  className = "",
}: {
  did: PlManMatch | undefined;
  hurt: boolean;
  className?: string;
}) {
  const parts = [
    did?.onAt == null ? null : `sub on ${did.onAt}'`,
    did?.offAt == null ? null : `sub off ${did.offAt}'${hurt ? " inj" : ""}`,
  ].filter((part) => part !== null);
  return parts.length === 0 ? null : (
    <span
      className={`numeric ml-auto shrink-0 whitespace-nowrap pl-2 text-xs font-bold text-mid lg:text-sm ${className}`}
    >
      {parts.join(" · ")}
    </span>
  );
}
