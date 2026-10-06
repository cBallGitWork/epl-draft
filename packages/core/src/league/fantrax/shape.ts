// What a payload is made of, as typed paths, and what changed between two. Field presence varies between leagues, so
// the danger is a field the rehearsal league has and the served one lacks: a mapper reading `undefined`.

/** How long a lowercase key must be before it can be taken for an id. */
const ID_MIN = 8;

/** Whether a key is an id, so id-keyed maps merge into one shape: it starts with a digit or dash or carries `_`
 *  (`075zi`, `-3`, `LG_AVG`), or is a long lowercase alphanumeric with a digit (`8enbgqo5msgb375j`, not `totalFpts2`).
 *  Key count is no test: a teamless league answers live scoring with a lone `-3`. */
function looksLikeId(key: string): boolean {
  if (/^[-0-9]/.test(key) || key.includes("_")) return true;
  return key.length >= ID_MIN && /^[a-z0-9]+$/.test(key) && /\d/.test(key);
}

function looksLikeIds(keys: string[]): boolean {
  return keys.length > 0 && keys.every(looksLikeId);
}

/** A scoring group's categories, and the positions each one prices: keyed by a league's settings, not by fields. */
const KEYED_BY_SETTINGS = /^scoringSystem\.scoringCategories\.[A-Z_]+(\{\})?$/;

/** Every path in a payload, arrays and id-keyed maps collapsed; each ends in its type, so a number turned string diffs. */
export function shapeOf(value: unknown, prefix = ""): Set<string> {
  const paths = new Set<string>();

  if (Array.isArray(value)) {
    // `[]` is recorded as itself: "no teams yet" is not "no such field".
    if (value.length === 0) paths.add(`${prefix}[]:empty`);
    for (const item of value) for (const path of shapeOf(item, `${prefix}[]`)) paths.add(path);
    return paths;
  }

  if (value === null || typeof value !== "object") {
    paths.add(`${prefix}:${value === null ? "null" : typeof value}`);
    return paths;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (looksLikeIds(entries.map(([key]) => key)) || KEYED_BY_SETTINGS.test(prefix)) {
    for (const [, inner] of entries) for (const path of shapeOf(inner, `${prefix}{}`)) paths.add(path);
    return paths;
  }

  if (entries.length === 0) paths.add(`${prefix}:empty-object`);
  for (const [key, inner] of entries) {
    for (const path of shapeOf(inner, prefix === "" ? key : `${prefix}.${key}`)) paths.add(path);
  }
  return paths;
}

export interface ShapeDiff {
  /** In the reference and absent from the subject, unexplained: the dangerous list, each one read as `undefined`. */
  missing: string[];
  /** In the reference and absent only because its collection came back empty, as before a draft; counted, never listed. */
  emptied: string[];
  /** In the subject only: ordinarily harmless, and reported so a person judges. */
  added: string[];
}

/** Whether a path sits inside an emptied stem; `fantasyTeamInfo` must not swallow `fantasyTeamInfoExtra`. */
function inside(path: string, stem: string): boolean {
  if (!path.startsWith(stem)) return false;
  const next = path.charAt(stem.length);
  return next === "" || next === "." || next === "[" || next === "{" || next === ":";
}

/** `…[]:empty` and `…:empty-object` describe a payload, not fields in it: they drive attribution and are never reported. */
function isSentinel(path: string): boolean {
  return path.endsWith(":empty") || path.endsWith(":empty-object");
}

/** What the subject has that the reference does not, and the reverse, sorted so a person can scan it. */
export function diffShapes(reference: Set<string>, subject: Set<string>): ShapeDiff {
  const empties = [...subject]
    .filter(isSentinel)
    .map((path) => path.slice(0, path.lastIndexOf(":")));

  const absent = [...reference].filter((path) => !subject.has(path) && !isSentinel(path));
  const emptied = absent.filter((path) => empties.some((stem) => inside(path, stem)));
  const missing = absent.filter((path) => !emptied.includes(path));

  return {
    missing: missing.sort(),
    emptied: emptied.sort(),
    added: [...subject].filter((path) => !reference.has(path) && !isSentinel(path)).sort(),
  };
}
