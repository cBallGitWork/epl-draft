// Which shape differences a person has already read and accepted: audited data, checked in, never inferred at runtime.

/** One difference somebody has read and accepted. */
export interface AcknowledgedDifference {
  /** The read it came from, as `shape-diff` labels it: the same path under another read is another judgement. */
  read: string;
  /** The path exactly as `diffShapes` reports it, type suffix included. */
  path: string;
  /** Why it is acceptable, in a person's words; an entry nobody can explain is not to be trusted. */
  why: string;
}

export interface ShapeResidue {
  /** Missing paths nobody has acknowledged. What the gate reddens on. */
  residue: string[];
  /** Acknowledged paths that no longer differ, reported so the file is pruned rather than grown into a blindfold. */
  settled: string[];
}

/** Split one read's missing paths against what has been acknowledged for it. */
export function unacknowledged(
  read: string,
  missing: readonly string[],
  baseline: readonly AcknowledgedDifference[],
): ShapeResidue {
  const acknowledged = baseline.filter((entry) => entry.read === read).map((entry) => entry.path);
  return {
    residue: missing.filter((path) => !acknowledged.includes(path)).sort(),
    settled: acknowledged.filter((path) => !missing.includes(path)).sort(),
  };
}

/** Entries naming a read the differ no longer makes — a renamed read strands its judgements. */
export function orphaned(
  baseline: readonly AcknowledgedDifference[],
  reads: readonly string[],
): AcknowledgedDifference[] {
  return baseline.filter((entry) => !reads.includes(entry.read));
}
