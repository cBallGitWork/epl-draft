import { redirect } from "next/navigation";
import { offerLive } from "../football";
import { landing } from "../landing";
import { signedIn } from "../session";

/** Sends a reader opening the site to Live or Mail, as `landing` says; `proxy.ts` rewrites a cold `/` here. */
export async function GET() {
  redirect(landing({ signedIn: await signedIn(), live: await offerLive() }));
}
