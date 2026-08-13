import { LEAGUE_NAME, SEASON } from "@epl/core";
import LeagueCrest from "../shell/LeagueCrest";

// The paper's own name, in the league's register rather than the football one.
// Tim Hortons red and cream belong to our competition; Premier League colours
// belong to the real world and stay out of the front page's furniture.

export default function Masthead({ line }: { line: string }) {
  return (
    <header className="flex flex-col gap-2 border-b-2 border-league pb-3">
      <div className="flex items-center justify-between gap-3">
        <LeagueCrest variant="mark" height={30} />
        <span className="numeric text-2xs uppercase tracking-widest text-faint">{SEASON}</span>
      </div>
      <h1 className="font-display text-3xl font-bold leading-none tracking-tight">
        {LEAGUE_NAME}
      </h1>
      <p className="text-sm text-muted">{line}</p>
    </header>
  );
}
