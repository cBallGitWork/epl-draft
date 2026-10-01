import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { FANTRAX_HOME_PATH, FANTRAX_LEAGUE_PAGE } from "@epl/core";
import { BUTTON } from "../components/shell/ButtonLink";
import OutLink from "../components/shell/OutLink";
import PageHeader from "../components/shell/PageHeader";
import { CREDITS, overflowSections, sectionsFor } from "../components/shell/sections";
import { LABEL, PANEL, PANEL_FLUSH, ROW_HOVER } from "@/app/desk";
import { offerLive } from "../football";
import { SQUAD } from "../squad/routes";
import { getLeagueSquads, readerTeamId } from "../squads";
import { MORE_TITLE } from "../titles";

// The page behind the phone's last tab: the sections with no tab of their own, the squads, Fantrax, how to install, and the credits.

export const metadata: Metadata = { title: MORE_TITLE };

/** Adding the app to a home screen, in each browser's own words for its buttons. */
const INSTALL: { device: string; steps: ReactNode[] }[] = [
  {
    device: "iPhone, in Safari",
    steps: [
      <>Tap <b>Share</b>, or <b>⋯</b> then <b>Share</b></>,
      <>Tap <b>Add to Home Screen</b></>,
      <>Tap <b>Add</b></>,
    ],
  },
  {
    device: "Android, in Chrome",
    steps: [
      <>Tap <b>⋮</b> at the top right</>,
      <>Tap <b>Add to Home screen</b> or <b>Install app</b></>,
      <>Tap <b>Install</b></>,
    ],
  },
];

export default async function MorePage() {
  const [matchday, team] = await Promise.all([offerLive(), readerTeamName()]);
  return (
    <>
      <PageHeader title={MORE_TITLE} competition />
      <nav aria-label={MORE_TITLE} className={PANEL_FLUSH}>
        {overflowSections(sectionsFor(matchday)).map((section) => (
          <Row key={section.href} href={section.href}>
            {section.fullLabel ?? section.label}
          </Row>
        ))}
        <Row href={SQUAD} aside={team ?? "Sign in"}>
          Squads
        </Row>
      </nav>
      <div className={PANEL}>
        <OutLink href={`${FANTRAX_LEAGUE_PAGE}/${FANTRAX_HOME_PATH}`} className={`${BUTTON} lg:self-start`}>
          Open the league on Fantrax
        </OutLink>
      </div>
      {/* Gone once installed: the app then opens in its own window. */}
      <section
        aria-labelledby="more-install"
        className={`${PANEL_FLUSH} gap-3 px-3.5 pb-3 pt-2 [@media(display-mode:standalone)]:hidden`}
      >
        <h2 id="more-install" className={LABEL}>
          Install on your phone
        </h2>
        {INSTALL.map(({ device, steps }) => (
          <div key={device}>
            <h3 className="font-chrome text-sm font-bold">{device}</h3>
            <ol className="list-decimal pl-5 text-sm">
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </section>
      <nav aria-labelledby="more-about" className={PANEL_FLUSH}>
        <h2 id="more-about" className={`px-3.5 pt-2 ${LABEL}`}>
          About
        </h2>
        <Row href={CREDITS}>Credits</Row>
      </nav>
    </>
  );
}

/** One row: the place, what it holds for you, and CM's small filled triangle for "this opens something". */
function Row({ href, aside, children }: { href: string; aside?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex min-h-13 items-center gap-3 pl-3.5 pr-3 font-chrome last:border-b-0 ${ROW_HOVER}`}
    >
      <span className="min-w-0 flex-1 truncate text-lg font-semibold">{children}</span>
      {aside === undefined ? null : <span className="shrink-0 text-sm text-muted">{aside}</span>}
      <span
        aria-hidden
        className="size-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-muted"
      />
    </Link>
  );
}

/** The signed-in reader's team name, or null for a reader with no code. */
async function readerTeamName(): Promise<string | null> {
  const [squads, mine] = await Promise.all([getLeagueSquads(), readerTeamId()]);
  if (mine === null || !("period" in squads)) return null;
  return squads.info?.teams.find((team) => team.teamId === mine)?.name ?? null;
}
