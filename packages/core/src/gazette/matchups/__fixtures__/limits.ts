import type { PositionLimits } from "../types";

/** The league's eleven limits as the commissioner set them: one keeper, three to five at the back, and so on. */
export const LIMITS: PositionLimits = { min: { G: 1, D: 3, M: 2, F: 1 }, max: { G: 1, D: 5, M: 5, F: 3 } };
