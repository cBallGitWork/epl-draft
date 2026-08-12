import { describe, expect, it } from "vitest";
import { FantraxError, errorEnvelope, pageErrorEnvelope, responseErrorEnvelope } from "./errors";
import { unwrapFxpa } from "./fxpa";
import pageError from "./__fixtures__/fxpaPageError.json";

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
  it("returns one payload per message, in order", () => {
    const body = { responses: [{ data: { a: 1 } }, { data: { b: 2 } }] };
    expect(unwrapFxpa("two", body)).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("throws the batch-level refusal", () => {
    expect(() => unwrapFxpa("getCommissionerHubInfo", pageError)).toThrow(FantraxError);
    expect(() => unwrapFxpa("getCommissionerHubInfo", pageError)).toThrow(/WARNING_NOT_LOGGED_IN/);
  });

  // A batch where the envelope is fine and one message is not. Checking only the
  // top level would hand back `null` for the refused message and let a caller
  // treat a refusal as an empty result.
  it("throws for a message that failed inside an otherwise healthy batch", () => {
    const body = {
      responses: [{ data: { fine: true } }, { errors: [{ code: "MISSING_PARAM", msg: "no" }] }],
    };
    expect(() => unwrapFxpa("batch", body)).toThrow(/MISSING_PARAM/);
    // The position is in the message: failing at index 1 and index 0 are
    // different bugs.
    expect(() => unwrapFxpa("batch", body)).toThrow(/batch\[1\]/);
  });

  it("refuses a body with no responses array rather than returning nothing", () => {
    expect(() => unwrapFxpa("x", {})).toThrow(/NO_RESPONSES/);
    expect(() => unwrapFxpa("x", null)).toThrow(/NO_RESPONSES/);
  });

  it("maps a response with neither data nor errors to null", () => {
    expect(unwrapFxpa("x", { responses: [{}] })).toEqual([null]);
  });
});
