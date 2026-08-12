import { FANTRAX_FXPA_BASE } from "../../config";
import { FantraxError, pageErrorEnvelope, responseErrorEnvelope } from "./errors";

// Fantrax's SPA API. A separate file from `client.ts` on purpose: different
// protocol (one POST carrying a batch), different failure envelope, and an
// optional credential. Folding it into the fxea client would mean one module
// where a reader cannot tell which surface a call is on.
//
// Several reads here need no auth at all — the transaction history among them —
// which is why this landed before any cookie flow exists. When a call does need
// a session, the cookie arrives as an ARGUMENT: §5 keeps environment reads out
// of core, and a credential read from ambient state is a credential nobody can
// see at the call site.

/** One request inside the batch. `data` is method-specific and untyped here —
 *  the mappers own the shapes, this file owns the transport. */
export interface FxpaMessage {
  method: string;
  data: Record<string, unknown>;
}

/** The batch envelope, minus everything we do not read. */
interface RawFxpaBody {
  responses?: unknown[];
}

/** Pull the payload for each message out of a batch response.
 *
 *  Pure, and split from the request for exactly that reason: every interesting
 *  failure mode here is a shape, not a network condition, so this is the part
 *  worth testing and it should not need a server to do it.
 *
 *  Both fxpa failure shapes are checked, because they mean different things. A
 *  `pageError` fails the whole batch — not logged in, not a member — while
 *  `responses[i].errors[]` fails one message and leaves its siblings healthy.
 *  Checking only the first would let a refused message look like a successful
 *  one that happened to return nothing. */
export function unwrapFxpa(method: string, body: unknown): unknown[] {
  const page = pageErrorEnvelope(body);
  if (page) {
    throw new FantraxError(method, page.code ?? "UNKNOWN", page.message ?? "no message");
  }

  const responses = (body as RawFxpaBody | null)?.responses;
  if (!Array.isArray(responses)) {
    throw new FantraxError(method, "NO_RESPONSES", "fxpa returned no responses array");
  }

  return responses.map((response, index) => {
    const error = responseErrorEnvelope(response);
    if (error) {
      // The index is in the message, because a batch failing at position 2 and a
      // batch failing at position 0 are different bugs.
      throw new FantraxError(
        `${method}[${index}]`,
        error.code ?? "UNKNOWN",
        error.message ?? "no message",
      );
    }
    return (response as { data?: unknown } | null)?.data ?? null;
  });
}

/** POST a batch and return one payload per message, in order.
 *
 *  `cookie` is optional and omitted entirely when absent rather than sent empty:
 *  the public reads answer fine without one, and an empty Cookie header is a
 *  request that looks authenticated and is not. */
export async function fxpaPost(
  leagueId: string,
  msgs: FxpaMessage[],
  cookie?: string,
): Promise<unknown[]> {
  const label = msgs.map((m) => m.method).join("+");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${FANTRAX_FXPA_BASE}?leagueId=${encodeURIComponent(leagueId)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ msgs }),
  });

  // As on fxea, a backstop only: fxpa reports its own refusals with a 200.
  if (!res.ok) throw new FantraxError(label, String(res.status), res.statusText);

  return unwrapFxpa(label, (await res.json()) as unknown);
}

/** One message's payload, for the common case of asking a single question. */
export async function fxpaGet(
  leagueId: string,
  method: string,
  data: Record<string, unknown> = {},
  cookie?: string,
): Promise<unknown> {
  const [payload] = await fxpaPost(leagueId, [{ method, data: { leagueId, ...data } }], cookie);
  return payload ?? null;
}
