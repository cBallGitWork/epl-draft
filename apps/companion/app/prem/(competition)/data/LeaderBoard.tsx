import Image from "next/image";
import Link from "next/link";
import { crestUrl, ordinal, type Club } from "@epl/core";
import { Head, HeadRow, NameHead, PRESSED_PLATE } from "../../../components/league/TableHeads";
import { IndexCell, ROW_LINK } from "../../../components/league/TableCells";
import { ROW_CREST } from "../../../components/football/ClubLabel";
import NameLink from "../../club/[code]/NameLink";
import { BOARD, FIGURE_CELL, INDEX_WIDTH, PANEL_FLUSH, ROW_HOVER, ROW_NAME, SECTION_BAR, SMALL_CAPS } from "@/app/desk";
import { printed, type LeaderList, type Ranked } from "./leaders";

// One list: the men in order, his club's crest and his name, the one figure in amber (ours in cyan), and the way to fifty.

export interface Row extends Ranked {
  club: Club | undefined;
  /** His own page, or null when our league does not list him. */
  href: string | null;
}

export default function LeaderBoard({
  list,
  rows,
  more,
  className = "",
}: {
  list: LeaderList;
  rows: readonly Row[];
  /** The plate under the list: where it leads and what it says. */
  more: { href: string; label: string };
  className?: string;
}) {
  // A mark is a derived reading, which DESIGN §3 inks cyan; a recorded figure alone beside a name is amber.
  const ink = list.source === "rating" ? "text-info" : "text-mid";
  return (
    <section className={`${PANEL_FLUSH} ${className}`}>
      {/* On a phone the picker above already names the one list it shows. */}
      <h2 className={`${SECTION_BAR} max-lg:sr-only`}>{list.title}</h2>
      {rows.length === 0 ? (
        <p className="px-2 py-3 text-sm text-muted">Nothing to rank yet.</p>
      ) : (
        <table className={`${BOARD} table-fixed`}>
          <caption className="sr-only">
            {list.title}, the top {rows.length}
          </caption>
          <thead>
            <HeadRow>
              <Head width={INDEX_WIDTH}>
                <span className="flex h-7 items-center justify-center px-1.5" />
              </Head>
              <NameHead label="Player" />
              <Head width="w-16" title={list.explain}>
                <span className={PRESSED_PLATE}>{list.head}</span>
              </Head>
            </HeadRow>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.code} className={ROW_HOVER}>
                <IndexCell>{ordinal(row.rank)}</IndexCell>
                <td className="pl-2">
                  <NameLink href={row.href} className={ROW_LINK}>
                    {row.club === undefined ? null : (
                      <Image
                        src={crestUrl({ code: row.club.code })}
                        alt=""
                        width={ROW_CREST.px}
                        height={ROW_CREST.px}
                        className={ROW_CREST.className}
                        title={row.club.name}
                        unoptimized
                      />
                    )}
                    <span className={`min-w-0 truncate ${ROW_NAME}`}>{row.name}</span>
                  </NameLink>
                </td>
                <td className={`${FIGURE_CELL} ${ink}`}>{printed(list, row.figure)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Link
        href={more.href}
        className={`cm-bevel m-2 flex min-h-11 items-center justify-center ${SMALL_CAPS} hover:brightness-110 lg:min-h-9`}
      >
        {more.label}
      </Link>
    </section>
  );
}
