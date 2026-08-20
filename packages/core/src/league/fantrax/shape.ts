// What a payload is *made of*, as a set of paths — and what changed between two
// of them.
//
// The 10 Oct swap is one environment variable, and the risk it carries is that
// every mapper in this repo was written against the rehearsal league's payloads.
// Fantrax varies field presence **between leagues, not only between states**:
// the real league's `getLeagueInfo` carries `draftType` and `leagueHistoryId`
// and the rehearsal one carries neither, which is why every field in `raw.ts` is
// optional. That was found by hand, once. This is how it gets found on purpose.
//
// The dangerous direction is not new fields — mappers ignore what they do not
// read. It is a field the rehearsal league has and the real one does not, which
// is a mapper reading `undefined` and a screen quietly showing nothing.

/** How long a lowercase key must be before it can be taken for an id. */
const ID_MIN = 8;

/** Whether a key is an identifier rather than a field name.
 *
 *  Fantrax keys whole objects by id — rosters by team, `playerInfo` by player,
 *  `allTeamsStats` by team — and walking those produces one branch per team,
 *  which is sixteen copies of one shape and no information. Merged instead.
 *
 *  Three ways to be an id, and the first two are the ones that matter:
 *
 *  - **It cannot be a field name.** Starts with a digit or a dash (`075zi`,
 *    `-3`), or carries an underscore (`LG_AVG`). Fantrax's sentinel team ids for
 *    league averages are exactly this, and they are the reason the count of keys
 *    cannot be part of the test: a league with no teams answers live scoring
 *    with a single `-3`, and a rule needing two keys to spot a dictionary would
 *    read that one as a field and diff every path under it twice.
 *  - **It is a long lowercase alphanumeric with a digit** — `8enbgqo5msgb375j`.
 *    Field names fail on the uppercase: `logoUrl256` and `totalFpts2` both carry
 *    digits and are both plainly fields.
 *
 *  A short lowercase field with a digit in it (`team1`) would be read as a
 *  field, correctly. A long one would be merged wrongly; that is the known cost
 *  and no such field has been seen. */
function looksLikeId(key: string): boolean {
  if (/^[-0-9]/.test(key) || key.includes("_")) return true;
  return key.length >= ID_MIN && /^[a-z0-9]+$/.test(key) && /\d/.test(key);
}

function looksLikeIds(keys: string[]): boolean {
  return keys.length > 0 && keys.every(looksLikeId);
}

/** Every path in a payload, with arrays and id-keyed maps collapsed.
 *
 *  A path ends in its type — `rosterInfo.teamName:string` — because a field that
 *  changes from a number to a string is the same silent failure as one that
 *  disappears, and it would otherwise diff as no change at all. */
export function shapeOf(value: unknown, prefix = ""): Set<string> {
  const paths = new Set<string>();

  if (Array.isArray(value)) {
    // An empty array says nothing about what it would contain. Recorded as
    // itself rather than as an absence: `[]` versus a missing key is the
    // difference between "no teams yet" and "no such field", and this whole
    // file exists to keep those apart.
    if (value.length === 0) paths.add(`${prefix}[]:empty`);
    for (const item of value) for (const path of shapeOf(item, `${prefix}[]`)) paths.add(path);
    return paths;
  }

  if (value === null || typeof value !== "object") {
    paths.add(`${prefix}:${value === null ? "null" : typeof value}`);
    return paths;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (looksLikeIds(entries.map(([key]) => key))) {
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
  /** In the reference, and absent from the subject for a reason the subject did
   *  not explain. **The dangerous list** — a mapper written against the
   *  reference reads `undefined` for every one of these. */
  missing: string[];
  /** In the reference, and absent only because the collection holding it came
   *  back empty. A league that has not drafted answers every table with `[]`,
   *  and calling that a hundred and forty missing fields is the loudest possible
   *  way to say "no teams yet" — it would bury a real difference and it would
   *  redden a gate that then gets switched off. Counted, never listed. */
  emptied: string[];
  /** In the subject and not in the reference. Ordinarily harmless: a mapper
   *  ignores what it does not read. Reported because "harmless" is a judgement a
   *  person should make rather than a differ. */
  added: string[];
}

/** Whether a path sits inside something the subject reported as empty.
 *
 *  The boundary check matters: `fantasyTeamInfo` must not swallow
 *  `fantasyTeamInfoExtra`, so what follows the stem has to be a step into it. */
function inside(path: string, stem: string): boolean {
  if (!path.startsWith(stem)) return false;
  const next = path.charAt(stem.length);
  return next === "" || next === "." || next === "[" || next === "{" || next === ":";
}

/** What the subject payload has that the reference does not, and the reverse.
 *
 *  Sorted, because this output is read by a person under time pressure on a
 *  Saturday morning, and a stable order is the difference between scanning it
 *  and re-reading it. */
export function diffShapes(reference: Set<string>, subject: Set<string>): ShapeDiff {
  const empties = [...subject]
    .filter((path) => path.endsWith(":empty") || path.endsWith(":empty-object"))
    .map((path) => path.slice(0, path.lastIndexOf(":")));

  const absent = [...reference].filter((path) => !subject.has(path));
  const emptied = absent.filter((path) => empties.some((stem) => inside(path, stem)));
  const missing = absent.filter((path) => !emptied.includes(path));

  return {
    missing: missing.sort(),
    emptied: emptied.sort(),
    added: [...subject].filter((path) => !reference.has(path)).sort(),
  };
}
