import { FANTRAX_FXPA_BASE } from "../../config";
import { demoFxpa, isDemo } from "./demo";
import { politeFetch } from "../../http/fetch";
import { FantraxError, pageErrorEnvelope, responseErrorEnvelope } from "./errors";

// Fantrax's SPA API. A separate file from `client.ts` on purpose: different
// protocol, different failure envelope. Folding it into the fxea client would
// leave one module where a reader cannot tell which surface a call is on.
//
// This is the surface the live scoreboard polls every thirty seconds on a
// Saturday, so it backs off when told to, exactly as the fxea reads do.
//
// The wire format carries a BATCH — `{"msgs":[…]}` answered by `responses[]` —
// and this asks exactly one question per request, because one question is all
// anything needs. Batching arrives when a second caller wants it, not before.
// Most reads need no auth; the lineup save passes the commissioner's session.

/** The one message's payload, or a `FantraxError` describing the refusal.
 *
 *  Pure, and split from the request for exactly that reason: every interesting
 *  failure here is a shape rather than a network condition, so this is the part
 *  worth testing and it should not need a server to do it.
 *
 *  Both fxpa failure shapes are checked, because they mean different things. A
 *  `pageError` fails the whole request — not logged in, not a member — while
 *  `responses[0].errors[]` fails the individual message. Checking only the
 *  first would let a refusal look like a successful read that happened to
 *  return nothing. */
export function unwrapFxpa(method: string, body: unknown): unknown {
  const page = pageErrorEnvelope(body);
  if (page) {
    throw new FantraxError(method, page.code ?? "UNKNOWN", page.message ?? "no message");
  }

  const responses = (body as { responses?: unknown[] } | null)?.responses;
  if (!Array.isArray(responses) || responses.length === 0) {
    throw new FantraxError(method, "NO_RESPONSES", "fxpa returned no responses");
  }

  const [response] = responses;
  const error = responseErrorEnvelope(response);
  if (error) {
    throw new FantraxError(method, error.code ?? "UNKNOWN", error.message ?? "no message");
  }

  return (response as { data?: unknown } | null)?.data ?? null;
}

/** The only methods a session may carry: the same cookie reaches `deleteLeague`. */
const SESSION_METHODS: ReadonlySet<string> = new Set([
  "getTeamRosterInfo",
  "confirmOrExecuteTeamRosterChanges",
  "setAutoSubsOrder",
]);

/** Ask fxpa one question, as the holder of `session` when one is given. */
export async function fxpaRead(
  leagueId: string,
  method: string,
  data: Record<string, unknown> = {},
  session?: string,
): Promise<unknown> {
  if (session !== undefined && !SESSION_METHODS.has(method)) {
    throw new FantraxError(method, "NOT_ALLOWED", "this method may not carry a session");
  }
  if (session === undefined && isDemo(leagueId)) {
    const canned = demoFxpa(method);
    if (canned !== null) return canned;
  }

  const res = await politeFetch(`${FANTRAX_FXPA_BASE}?leagueId=${encodeURIComponent(leagueId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(session ? { Cookie: session } : {}) },
    body: JSON.stringify({ msgs: [{ method, data: { leagueId, ...data } }] }),
  });

  // As on fxea, a backstop only: fxpa reports its own refusals with a 200.
  if (!res.ok) throw new FantraxError(method, String(res.status), res.statusText);

  return unwrapFxpa(method, (await res.json()) as unknown);
}
