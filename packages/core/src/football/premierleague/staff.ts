import type { RawPlStaff } from "./raw";

/** The club's manager, only when its staff list names exactly one: four clubs list two, with nothing to say which picked the side. */
export function plManager(staff: RawPlStaff): string | null {
  const managers = (staff.officials ?? []).filter((o) => o.role === "Manager" && o.active !== false && o.name?.display);
  return managers.length === 1 ? (managers[0].name?.display ?? null) : null;
}
