"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ENTRY_COOKIE, SEASON_IN_SECONDS } from "../config";

/** Remember a manager's FPL entry id.
 *
 *  No verification beyond "is it a number": FPL will say soon enough whether it
 *  knows the id, and the page reports that honestly. Claiming somebody else's
 *  shows you their side on your own phone and nothing more. */
export async function rememberEntry(_previous: string | null, form: FormData): Promise<string | null> {
  const id = Number(String(form.get("entry") ?? "").trim());
  if (!Number.isInteger(id) || id <= 0) return "That is not an FPL team id.";

  (await cookies()).set(ENTRY_COOKIE, String(id), {
    sameSite: "lax",
    path: "/",
    maxAge: SEASON_IN_SECONDS,
  });
  redirect("/fpl");
}

export async function forgetEntry(): Promise<void> {
  (await cookies()).delete(ENTRY_COOKIE);
  redirect("/fpl");
}
