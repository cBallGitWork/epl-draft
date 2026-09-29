import { FANTRAX_LEAGUE_ID, buildDraftBrief, requireLeague } from "@epl/core";
import { draftDesk } from "./edition/draftDesk";

// The draft report's brief for one gameweek at both cut-offs, after Saturday's matches and at the end of the gameweek,
// printed and never written up: `GAZETTA_GAMEWEEK=5 npm run draft:proof`. Every read is public; no model is called.

async function main(): Promise<void> {
  requireLeague(FANTRAX_LEAGUE_ID);
  const gameweek = Number(process.env.GAZETTA_GAMEWEEK);
  if (!Number.isInteger(gameweek)) throw new Error("GAZETTA_GAMEWEEK names the gameweek to read.");
  const desk = await draftDesk(gameweek);
  const out = [`League ${FANTRAX_LEAGUE_ID}, period ${desk.period}, gameweek ${gameweek}; played on ${desk.days.join(", ")}.`, ...desk.notes];
  for (const [cutoff, contexts] of desk.cutoffs) out.push("", `########## ${cutoff === "saturday" ? "AFTER SATURDAY" : "END OF THE GAMEWEEK"} ##########`, "", buildDraftBrief(cutoff, gameweek, contexts));
  process.stdout.write(`${out.join("\n")}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
