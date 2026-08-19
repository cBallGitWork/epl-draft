"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SEASON_IN_SECONDS, TEAM_COOKIE, WRONG_CODE_DELAY_MS } from "../config";
import { sign, teamForCode } from "../session";

// Signing in and out. The only two writes in the app, and neither of them
// touches Fantrax.

/** Claim a team with the code the commissioner handed out.
 *
 *  Returns a message on failure rather than throwing: a mistyped code is the
 *  ordinary case, not an exception, and the form needs something to say. */
export async function claimTeam(_previous: string | null, form: FormData): Promise<string | null> {
  const code = String(form.get("code") ?? "");
  const teamId = await teamForCode(code);

  if (teamId === null) {
    // Slow, because there is no rate limiter in front of this and sixteen teams
    // is a small haystack. Not slow enough to be felt by someone typing it right.
    await new Promise((resolve) => setTimeout(resolve, WRONG_CODE_DELAY_MS));
    return "That code does not match a team. Ask the commissioner for yours.";
  }

  const value = await sign(teamId);
  if (value === null) return "Sign-in is not configured on this deployment.";

  (await cookies()).set(TEAM_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SEASON_IN_SECONDS,
  });

  redirect("/squad");
}

export async function forgetTeam(): Promise<void> {
  (await cookies()).delete(TEAM_COOKIE);
  redirect("/squad");
}
