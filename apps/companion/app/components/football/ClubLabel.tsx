import Image from "next/image";
import { crestUrl } from "@epl/core";
import { ROW_NAME } from "@/app/desk";

/** The crest in a table row's badge slot. `max-w-none` lifts preflight's `max-width: 100%`, under which
 *  WebKit sizes a table column as if the crest were not there. */
export const ROW_CREST = {
  px: 26,
  className: "h-[var(--row-badge)] w-[var(--row-badge)] max-w-none shrink-0 object-contain",
};

/** A club in a row: its crest, the short name on a phone and the full name on the desk; CSS picks. */
export default function ClubLabel({
  club,
  crest = ROW_CREST,
  title,
}: {
  club: { code: number; shortName: string; name: string };
  crest?: { px: number; className: string };
  title?: string;
}) {
  return (
    <>
      <Image
        src={crestUrl({ code: club.code })}
        alt=""
        width={crest.px}
        height={crest.px}
        className={crest.className}
        // Beside a name already there: a screen reader hears the club once.
        aria-hidden
        title={title}
        unoptimized
      />
      <span className={`shrink-0 lg:hidden ${ROW_NAME}`}>{club.shortName}</span>
      <span className={`hidden min-w-0 truncate lg:inline ${ROW_NAME}`}>{club.name}</span>
    </>
  );
}
