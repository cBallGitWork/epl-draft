import { FANTRAX_FXPA_BASE } from "../../config";
import { demoFxpa, isDemo } from "./demo";
import { kindOfStatus } from "../../http/errors";
import { politeFetch } from "../../http/fetch";
import { readJson } from "../../http/json";
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

/** The one message's payload, or a `FantraxError`: refused for a `pageError` (the whole request) or
 *  `responses[0].errors[]` (the message), malformed for an answer with no payload in it. Pure, so
 *  every shape is testable without a server. */
export function unwrapFxpa(method: string, body: unknown): unknown {
  const page = pageErrorEnvelope(body);
  if (page) {
    throw new FantraxError(method, page.code ?? "UNKNOWN", page.message ?? "no message");
  }

  const responses = (body as { responses?: unknown[] } | null)?.responses;
  if (!Array.isArray(responses) || responses.length === 0) {
    throw new FantraxError(method, "NO_RESPONSES", "fxpa returned no responses", "malformed");
  }

  const [response] = responses;
  const error = responseErrorEnvelope(response);
  if (error) {
    throw new FantraxError(method, error.code ?? "UNKNOWN", error.message ?? "no message");
  }

  const data = (response as { data?: unknown } | null)?.data;
  if (data === undefined || data === null) {
    throw new FantraxError(method, "NO_DATA", "fxpa answered with neither data nor errors", "malformed");
  }
  return data;
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

  // A POST that only reads, so safe to resend; a write must never pass `idempotent`.
  const res = await politeFetch(
    `${FANTRAX_FXPA_BASE}?leagueId=${encodeURIComponent(leagueId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msgs: [{ method, data: { leagueId, ...data } }] }),
    },
    { idempotent: true },
  );

  // As on fxea, a backstop only: fxpa reports its own refusals with a 200.
  if (!res.ok) throw new FantraxError(method, String(res.status), res.statusText, kindOfStatus(res.status));

  return unwrapFxpa(method, await readJson(res, "Fantrax", method));
}
