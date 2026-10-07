import { FANTRAX_FXPA_BASE } from "../../config";
import { demoFxpa, isDemo } from "./demo";
import { politeFetch } from "../../http/fetch";
import { readJson } from "../../http/json";
import { FantraxError, pageErrorEnvelope, responseErrorEnvelope, statusFailure } from "./errors";

// Fantrax's SPA API, apart from `client.ts`: a different protocol and failure envelope. It backs off when told to and
// asks one question per request, though the wire takes a batch. Most reads need no auth; the lineup save carries a session.

/** The one message's payload, or a `FantraxError` for a `pageError` (the request), `responses[0].errors[]` (the message)
 *  or no payload at all. Pure. */
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

/** The only methods a session may carry: the same cookie reaches `deleteLeague`. */
const SESSION_METHODS: ReadonlySet<string> = new Set([
  "getTeamRosterInfo",
  "getTradeBlocks",
  "getTransactionDetailsHistory",
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

  // A read is safe to send twice; a session call may be a lineup write, so it goes once.
  const res = await politeFetch(`${FANTRAX_FXPA_BASE}?leagueId=${encodeURIComponent(leagueId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(session ? { Cookie: session } : {}) },
    body: JSON.stringify({ msgs: [{ method, data: { leagueId, ...data } }] }),
  }, { idempotent: session === undefined });

  // As on fxea, a backstop only: fxpa reports its own refusals with a 200.
  if (!res.ok) throw statusFailure(method, res);

  const body = await readJson(res, (arrived) => new FantraxError(method, "NOT_JSON", arrived, "malformed"));
  return unwrapFxpa(method, body);
}
