import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderError } from "../../http/errors";
import { htmlPage, serve, statusOnly } from "../../http/fakeFetch";
import { FantraxError, errorEnvelope, pageErrorEnvelope, responseErrorEnvelope } from "./errors";
import { fxpaRead, unwrapFxpa } from "./fxpa";
import pageError from "./__fixtures__/fxpaPageError.json";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// The fxpa envelope, recorded 12 Aug 2026 by asking the real league for its
// commissioner hub without a session.

describe("pageErrorEnvelope", () => {
  it("reads a refusal Fantrax served with HTTP 200", () => {
    const error = pageErrorEnvelope(pageError);
    expect(error?.code).toBe("WARNING_NOT_LOGGED_IN");
    expect(error?.message).toContain("logged in");
  });

  // Two surfaces, two shapes, two detectors — and this is why they are separate
  // functions rather than one that got taught to look for both. Each call site
  // knows which protocol it is on, and neither can quietly start accepting the
  // other's failures.
  it("does NOT catch an fxea error, and fxea's does not catch this one", () => {
    const fxea = { error: { code: "NO_TEAMS", message: "no teams" } };

    expect(errorEnvelope(fxea)).not.toBeNull();
    expect(pageErrorEnvelope(fxea)).toBeNull();

    expect(pageErrorEnvelope(pageError)).not.toBeNull();
    expect(errorEnvelope(pageError)).toBeNull();
  });

  // The subtler half of the same trap. Even having found the object, a reader
  // that reached for `.message` — the key fxea uses — would report every fxpa
  // failure as "no message", which reads like a bug in our own error handling
  // rather than like Fantrax telling us something.
  it("takes the human text from `text`, which is not what fxea calls it", () => {
    expect(pageError).not.toHaveProperty("pageError.message");
    expect(pageErrorEnvelope({ pageError: { code: "X", text: "the reason" } })?.message).toBe(
      "the reason",
    );
  });

  it("ignores a healthy body and anything that is not one", () => {
    expect(pageErrorEnvelope({ responses: [{ data: {} }] })).toBeNull();
    expect(pageErrorEnvelope(null)).toBeNull();
    expect(pageErrorEnvelope("nope")).toBeNull();
    expect(pageErrorEnvelope({ pageError: { text: "no code" } })).toBeNull();
  });
});

describe("responseErrorEnvelope", () => {
  it("reads a refusal aimed at one message in the batch", () => {
    const error = responseErrorEnvelope({ errors: [{ code: "MISSING_PARAM", msg: "need one" }] });
    expect(error).toEqual({ code: "MISSING_PARAM", message: "need one" });
  });

  it("is silent on a healthy response and an empty error list", () => {
    expect(responseErrorEnvelope({ data: { table: {} } })).toBeNull();
    expect(responseErrorEnvelope({ errors: [] })).toBeNull();
  });
});

describe("unwrapFxpa", () => {
  it("returns the payload", () => {
    expect(unwrapFxpa("one", { responses: [{ data: { a: 1 } }] })).toEqual({ a: 1 });
  });

  it("throws the request-level refusal", () => {
    expect(() => unwrapFxpa("getCommissionerHubInfo", pageError)).toThrow(FantraxError);
    expect(() => unwrapFxpa("getCommissionerHubInfo", pageError)).toThrow(/WARNING_NOT_LOGGED_IN/);
  });

  // The envelope is fine and the message inside it is not. Checking only the top
  // level would hand back `null` and let a caller read a refusal as an empty
  // result — which, for a transaction log, is the difference between "no trades
  // happened" and "we were not allowed to look".
  it("throws for a message that failed inside an otherwise healthy response", () => {
    const body = { responses: [{ errors: [{ code: "MISSING_PARAM", msg: "no" }] }] };
    expect(() => unwrapFxpa("read", body)).toThrow(/MISSING_PARAM/);
  });

  it("refuses a body with no responses rather than returning nothing", () => {
    expect(() => unwrapFxpa("x", {})).toThrow(/NO_RESPONSES/);
    expect(() => unwrapFxpa("x", null)).toThrow(/NO_RESPONSES/);
    expect(() => unwrapFxpa("x", { responses: [] })).toThrow(/NO_RESPONSES/);
  });

  it("calls a refusal refused and a body with no responses malformed", () => {
    expect(() => unwrapFxpa("x", pageError)).toThrow(expect.objectContaining({ kind: "refused" }));
    expect(() => unwrapFxpa("x", {})).toThrow(expect.objectContaining({ kind: "malformed" }));
  });

  it("maps a response with neither data nor errors to null", () => {
    expect(unwrapFxpa("x", { responses: [{}] })).toBeNull();
  });
});

describe("fxpaRead", () => {
  const LEAGUE = "league-under-test";

  it("reads a web page in place of JSON as malformed, not as a SyntaxError", async () => {
    serve(htmlPage);
    const error = await fxpaRead(LEAGUE, "getStandings").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ provider: "Fantrax", what: "getStandings", kind: "malformed" });
  });

  it("asks again when Fantrax is busy, since a read is safe to repeat", async () => {
    vi.useFakeTimers();
    const count = serve(statusOnly(503), () => Response.json({ responses: [{ data: { a: 1 } }] }));
    const pending = fxpaRead(LEAGUE, "getStandings");
    await vi.runAllTimersAsync();
    expect(await pending).toEqual({ a: 1 });
    expect(count.calls).toBe(2);
  });

  it("reads a 404 as a Fantrax refusal", async () => {
    serve(statusOnly(404));
    const error = await fxpaRead(LEAGUE, "getStandings").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(FantraxError);
    expect(error).toMatchObject({ code: "404", kind: "refused" });
  });
});
