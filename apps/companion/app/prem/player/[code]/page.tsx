import { notFound } from "next/navigation";
import { clubColours, crestUrl, plateOn } from "@epl/core";
import Image from "next/image";
import Caption from "../../../components/shell/Caption";
import PageHeader from "../../../components/shell/PageHeader";
import ButtonLink from "../../../components/shell/ButtonLink";
import PlayerPortrait from "../../../components/football/PlayerPortrait";
import StateBox from "../../../components/football/StateBox";
import { footballNow } from "../../../football";
import { CLUB } from "../../PremNav";
import { FACT, FACT_LABEL, PANEL } from "@/app/desk";

// One footballer, and for now only what the bootstrap already knows.
//
// **A stub on purpose** (Craig, 3 Sep 2026: "clicking a player takes them to a
// player page (just scaffold, will do later)"). Every name on a club's squad
// list is a link, and a link to a 404 is worse than no link: this is where those
// links land, carrying his identity and his season, with the room for the rest
// left visibly empty rather than filled with something invented.
//
// **Not `/players/[fantraxId]`, which is the other register's player page.**
// That one is the fantasy pool: Fantrax's points, his eligibility, who holds
// him, what he cost at the draft. This is the footballer — FPL's own counts and
// nothing our league has an opinion about. The two are different screens about
// the same person, and keyed differently on purpose: this one takes FPL's
// season-stable `code`, because a URL is persisted the moment somebody shares it
// and `id` is recycled between seasons (CODE_RULES §3).

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

export default async function PlayerPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const wanted = Number(code);
  if (!Number.isInteger(wanted)) notFound();

  const snapshot = await footballNow();
  const player = snapshot.players.find((entry) => entry.code === wanted);
  if (player === undefined) notFound();

  const club = snapshot.clubs.find((entry) => entry.id === player.clubId);
  const colours = clubColours(club?.shortName ?? "");
  const plate = plateOn(colours);

  return (
    <div className="flex flex-col gap-2">
      <PageHeader title={player.fullName} plate={plate} />
      <Caption>Player</Caption>

      <section className={PANEL}>
        <div className="flex items-center gap-3">
          <PlayerPortrait player={{ code: player.code, name: player.name }} colours={colours} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">{player.name}</p>
            {club === undefined ? null : (
              <p className="flex items-center gap-1.5 text-2xs text-faint">
                <Image
                  src={crestUrl(club)}
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4 shrink-0 object-contain"
                  aria-hidden
                  unoptimized
                />
                {club.name}
              </p>
            )}
          </div>
          <StateBox player={player} />
        </div>

        <dl className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
          <Figure label="Minutes" value={player.season.minutes} />
          <Figure label="Starts" value={player.season.starts} />
          <Figure label="Goals" value={player.season.goals} />
          <Figure label="Assists" value={player.season.assists} />
        </dl>

        {/* Said rather than left blank. A screen that simply stops is one a
            reader assumes is broken; this one is honest about being early. */}
        <p className="text-2xs text-faint">
          His match log, his underlying numbers and his real position are still to come. Until
          then this is what the bootstrap knows.
        </p>
      </section>

      {club === undefined ? (
        <ButtonLink href="/prem">Back to the table</ButtonLink>
      ) : (
        <ButtonLink href={`${CLUB}/${club.code}`}>Back to {club.name}</ButtonLink>
      )}
    </div>
  );
}

/** One figure and its name, on the fact-row shape `/players/[fantraxId]` uses. */
function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className={FACT}>
      <dt className={FACT_LABEL}>{label}</dt>
      <dd className="numeric font-bold">{value}</dd>
    </div>
  );
}
