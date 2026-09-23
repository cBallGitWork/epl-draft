import TabEmpty from "../../../components/league/TabEmpty";
import { headToHead, inkOn, ordinal, teamColours } from "@epl/core";
import TeamShell from "../Shell";
import { SQUAD } from "../../routes";
import { identify, whoseTeam } from "../team";
import { getLeagueSquads, readableOr404 } from "../../../squads";
import { planningRound } from "../../../round";
import { leagueTable } from "../../../standings";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LABEL, PANEL_FLUSH } from "@/app/desk";

// Who he plays, and the one screen in this app that is about a confrontation.
//
// **This is where a team's colour earns itself.** Championship Manager sets the
// two sides' own colours against each other in a match header — Everton's blue
// against Arsenal's red in `cm9900/21.jpg`, against Torquay's WHITE in `16.jpg`
// — and that is the whole of what club colour does in the game. It does not
// theme a page. So the squad's bar carries the team's plate because the screen
// is about him, and this screen carries two plates because it is about a
// fixture, and nothing else in the app carries one at all.
//
// The pairing costs no request: `LeagueInfo.matchups` is already in the payload
// every squad screen reads, and `headToHead` is the same selector the squad tab
// uses for the "v opponent" line in its subheading.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

export default async function NextMatchPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId: slug } = await params;
  // The whole read rather than `teamOr404`, because this screen needs the
  // matchups and the period as well as the name — one read either way.
  const [read, table] = await Promise.all([
    getLeagueSquads(await planningRound()),
    leagueTable(),
  ]);
  const squads = readableOr404(read, SQUAD);

  const { teamId } = await whoseTeam(slug, squads.period.teams);
  const team = squads.period.teams.find((t) => t.teamId === teamId);
  if (!team) notFound();

  const tie =
    squads.info !== null && squads.roundPeriod !== null
      ? headToHead(squads.info.matchups, squads.info.teams, squads.roundPeriod, teamId)
      : undefined;

  // Where each side stands, for the bracket beside his name. Fantrax's own
  // placing and never a sort of ours — where a points tie is broken is a rule of
  // their competition. Empty when the table would not answer, and then the
  // bracket is simply absent rather than showing a guess.
  const placing = new Map(
    "unavailable" in table ? [] : table.map((row) => [row.teamId, row.rank] as const),
  );

  return (
    <TeamShell
      team={identify(team, slug)}
      current="next"
      empty={tie === undefined ? ["next"] : []}
    >
      {tie === undefined ? (
        <TabEmpty>{/* Two different absences and only one of them is a fault. Fantrax
                not describing the league at all is an outage; the league simply
                not pairing this side this gameweek is an ordinary bye. */}
            {squads.info === null
              ? "We cannot read the league's own description of itself right now."
              : `${team.teamName} has no fixture this gameweek.`}</TabEmpty>
      ) : (
        <Fixture
          gameweek={squads.snapshot.gameweek}
          home={{ teamId: tie.team.teamId, name: tie.team.name, rank: placing.get(tie.team.teamId) }}
          away={{
            teamId: tie.opponent.teamId,
            name: tie.opponent.name,
            rank: placing.get(tie.opponent.teamId),
          }}
        />
      )}
    </TeamShell>
  );
}

/** The two sides, each on its own colour.
 *
 *  Neither is at home — a fantasy fixture has no ground — so the team whose
 *  screen this is reads first, which is the rule every head-to-head surface in
 *  this app already follows. */
function Fixture({
  gameweek,
  home,
  away,
}: {
  gameweek: number;
  home: SideTeam;
  away: SideTeam;
}) {
  return (
    <section className={PANEL_FLUSH}>
      {/* **The round gets a row of its own** (Craig, 2 Sep: "have a row for the
          gameweek"). It was in the subheading above the tabs, which is where a
          reader looks last — and on a screen about ONE match, which round it is
          belongs with the match rather than with the page. `cm9900/21.jpg` puts
          the ground on a strip under its match header for the same reason: the
          circumstances of the fixture sit with the fixture. */}
      {/* An ordinary strip, not a masthead (Craig, 2 Sep: "huge row for the
          gameweek, make it normal size — remove Period 3 text"). It was
          inheriting the plated title bar's `min-h-16 lg:min-h-24`, which is the
          size a screen's SUBJECT is set at; the round is a caption on this one.
          The period goes with it: it is how the league counts a week and the
          gameweek is how a reader dates one, and printing both put one number
          under two names. */}
      {/* `cm-tab` and not `cm-titlebar`: the title bar carries a `min-height` of
          6rem above `lg` because it is a screen's masthead, and a `min-h-0`
          beside it loses on specificity — which is the right outcome, since
          fighting a plate's own height means the wrong plate was chosen. A tab
          plate is the same chrome at a strip's height. */}
      <div className="cm-tab flex items-center justify-center px-2 py-1">
        <span className="numeric text-2xs font-bold uppercase text-ink">Gameweek {gameweek}</span>
      </div>

      <div className="flex items-stretch gap-2 p-2">
        <Side team={home} />
        <span className={`flex shrink-0 items-center px-1 font-chrome ${LABEL}`}>
          v
        </span>
        <Side team={away} linked />
      </div>
    </section>
  );
}

interface SideTeam {
  teamId: string;
  name: string;
  /** Where he stands in the league. Undefined when the table would not answer. */
  rank: number | undefined;
}

function Side({ team, linked = false }: { team: SideTeam; linked?: boolean }) {
  const colours = teamColours(team.teamId);
  const label = (
    <span
      className="flex min-h-11 flex-1 flex-col items-center justify-center px-2 text-center leading-tight"
      style={{ background: colours.primary, color: inkOn(colours) }}
    >
      <span className="text-sm font-bold uppercase">{team.name}</span>
      {/* His placing, in brackets under the name (Craig, 2 Sep). `cm9900/25.jpg`
          runs "6th in PRM" in its foot row — a club's standing is part of how
          the game introduces it, and on a match header it is the one fact that
          says whether this is a hard fixture. On his own plate rather than
          beside it, so the ink stays the plate's own readable pair. */}
      {team.rank === undefined ? null : (
        <span className="numeric text-3xs font-bold opacity-80">({ordinal(team.rank)})</span>
      )}
    </span>
  );

  // Only the opponent is a link: a link to the page you are on is a dead control
  // that still looks like a live one.
  return linked ? (
    <Link href={`/squad/${team.teamId}`} className="flex min-w-0 flex-1">
      {label}
    </Link>
  ) : (
    <span className="flex min-w-0 flex-1">{label}</span>
  );
}
