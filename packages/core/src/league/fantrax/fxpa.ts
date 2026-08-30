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
// The same goes for the session cookie: several reads here need no auth at all,
// which is what let the transaction history land before any cookie flow exists,
// and a credential parameter nothing passes is a parameter written for a
// future we have not designed.

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

/** Ask fxpa one question. */
export async function fxpaRead(
  leagueId: string,
  method: string,
  data: Record<string, unknown> = {},
): Promise<unknown> {
  if (isDemo(leagueId)) {
    const canned = demoFxpa(method);
    if (canned !== null) return canned;
  }

  const res = await politeFetch(`${FANTRAX_FXPA_BASE}?leagueId=${encodeURIComponent(leagueId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msgs: [{ method, data: { leagueId, ...data } }] }),
  });

  // As on fxea, a backstop only: fxpa reports its own refusals with a 200.
  if (!res.ok) throw new FantraxError(method, String(res.status), res.statusText);

  return unwrapFxpa(method, (await res.json()) as unknown);
}
