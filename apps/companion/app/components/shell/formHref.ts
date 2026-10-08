/** Where a GET form goes: `action` and its filled fields, trimmed, as a submit sends them less the empty ones. */
export function formHref(action: string, fields: Iterable<[string, FormDataEntryValue]>): string {
  const query = new URLSearchParams();
  for (const [name, value] of fields) {
    if (typeof value === "string" && value.trim() !== "") query.set(name, value.trim());
  }
  const search = query.toString();
  return search === "" ? action : `${action}?${search}`;
}
