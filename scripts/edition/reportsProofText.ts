import type { MatchDesk, ReportsDraft } from "@epl/core";

// The day as a reader would meet it, in plain text, for reading a proof before anything is drawn.

export function proofText(draft: ReportsDraft, desks: readonly MatchDesk[]): string {
  const blocks = desks.map((desk) => {
    const { match } = desk;
    const piece = draft.matches.get(match.fixture.code);
    const score = `${match.home.name.toUpperCase()} ${match.fixture.homeScore}-${match.fixture.awayScore} ${match.away.name.toUpperCase()}`;
    const rows = desk.events.filter((e) => ["goal", "penalty-goal", "own-goal", "sent-off", "second-yellow", "ruled-out"].includes(e.kind) || e.injury);
    return [
      score,
      rows.map((e) => `  ${e.minute}' ${e.kind}${e.man === null ? "" : ` ${e.man.name}`}${e.injury ? " (injured)" : ""}`).join("\n"),
      piece === undefined ? "[the desk's plain line: this match failed its checks twice]" : [
        piece.standfirst,
        "",
        piece.account,
        ...piece.sections.flatMap((s) => ["", s.head.toUpperCase(), `${s.pitch} ${s.stake}`]),
      ].join("\n"),
      "",
      "KEY STATS",
      ...desk.keyStats.map((k) => `  ${k.text}`),
    ].join("\n");
  });
  return [draft.headline, "", ...blocks].join("\n\n");
}
