import { NextResponse, type NextRequest } from "next/server";
import { TEAM_COOKIE } from "./app/config";
import { START, openedCold } from "./app/landing";
import { cookieTeamOf } from "./app/sessionCookie";

/** A signed-in reader opening `/` from outside the site goes to `START`; everybody else gets the paper.
 *  `/?paper` is the paper for anybody, which is how an instrument shoots it signed in. */
export async function proxy(request: NextRequest) {
  const raw = request.cookies.get(TEAM_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  if (request.nextUrl.searchParams.has("paper") || !openedCold(request.headers) || !raw || !secret) {
    return NextResponse.next();
  }
  if ((await cookieTeamOf(raw, secret)) === null) return NextResponse.next();
  return NextResponse.rewrite(new URL(START, request.url));
}

export const config = { matcher: "/" };
