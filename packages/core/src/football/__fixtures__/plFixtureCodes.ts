import type { RawPlFixture } from "../premierleague/raw";
import recordedFixture from "./plFixture.json";

/** FPL's `opta_code` to `code` for both of `plFixture.json`'s sheets: each man's own id plus a million, so a wrong join shows. */
export const OPTA_TO_CODE = new Map(
  ((recordedFixture as unknown as RawPlFixture).teamLists ?? []).flatMap((list) =>
    list === null
      ? []
      : [...list.lineup, ...list.substitutes].flatMap((p) =>
          p.altIds ? [[p.altIds.opta, p.id + 1_000_000] as [string, number]] : [],
        ),
  ),
);
