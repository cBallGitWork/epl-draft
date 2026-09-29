import type { SlotWorth } from "../types";

/** The league's prices for a return, as the real league's table has them, and a full match's minutes. */
export function worthOf(appearance = 0): SlotWorth {
  return {
    appearance,
    extra: {},
    returns: {
      G: [{ kind: "clean sheet", worth: 4 }],
      D: [{ kind: "goal", worth: 6 }, { kind: "assist", worth: 3 }, { kind: "clean sheet", worth: 4 }],
      M: [{ kind: "goal", worth: 5 }, { kind: "assist", worth: 3 }, { kind: "clean sheet", worth: 1 }],
      F: [{ kind: "goal", worth: 4 }, { kind: "assist", worth: 3 }],
    },
  };
}
