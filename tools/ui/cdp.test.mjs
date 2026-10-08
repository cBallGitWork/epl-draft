// The shared client's pure parts, by node's own runner: vitest's include list does not reach tools/.
//
//   node --test "tools/ui/*.test.mjs"

import assert from "node:assert/strict";
import { test } from "node:test";
import { teamCookieFor } from "./cdp.mjs";

test("the team cookie is set on the host the instruments open, not always on localhost", () => {
  assert.equal(teamCookieFor("signed", "http://localhost:3000").domain, "localhost");
  assert.equal(teamCookieFor("signed", "http://127.0.0.1:3000").domain, "127.0.0.1");
  assert.equal(teamCookieFor("signed", "https://epl-draft.vercel.app").domain, "epl-draft.vercel.app");
});

test("the team cookie covers every route", () => {
  assert.deepEqual(teamCookieFor("signed", "http://127.0.0.1:3000"), {
    name: "team",
    value: "signed",
    domain: "127.0.0.1",
    path: "/",
  });
});
