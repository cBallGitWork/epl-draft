import type { ReportsDraft } from "./draft";

// The senior writer's copy: the brief's facts and the page as it stands, checked, for one last pass that turns the pieces
// into a sports article. Nothing new may come in; what goes out is checked again, and the page as it stands is kept when
// the woven copy breaks more rules.

export function weaveBrief(brief: string, draft: ReportsDraft, codes: readonly number[]): string {
  const matches = codes.flatMap((code) => {
    const piece = draft.matches.get(code);
    return piece === undefined ? [] : [{ fixture: code, standfirst: piece.standfirst, account: piece.account.split("\n"), sections: piece.sections }];
  });
  return `${brief}\n\n=====\n\nTHE PAGE AS FILED, checked against the facts above. Weave it:\n${JSON.stringify({ matches }, null, 1)}`;
}
