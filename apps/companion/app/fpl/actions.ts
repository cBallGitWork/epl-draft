"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ENTRY_COOKIE, SEASON_IN_SECONDS } from "../config";
import { claim } from "./claim";
import { knownEntry } from "./entry";
import { FPL } from "../components/shell/sections";

/** Remember a manager's FPL entry id, once FPL has said it has a team by that id. */
export async function rememberEntry(_previous: string | null, form: FormData): Promise<string | null> {
  const answer = await claim(String(form.get("entry") ?? ""), knownEntry);
  if ("refusal" in answer) return answer.refusal;

  (await cookies()).set(ENTRY_COOKIE, String(answer.id), {
    sameSite: "lax",
    path: "/",
    maxAge: SEASON_IN_SECONDS,
  });
  revalidatePath(FPL);
  redirect(FPL);
}

export async function forgetEntry(): Promise<void> {
  (await cookies()).delete(ENTRY_COOKIE);
  revalidatePath(FPL);
  redirect(FPL);
}
