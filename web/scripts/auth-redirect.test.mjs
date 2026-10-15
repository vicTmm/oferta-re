import { test } from "node:test";
import assert from "node:assert/strict";
import { authDestination } from "../src/lib/auth-redirect.ts";
test("auth callbacks reject external, protocol-relative and encoded redirect destinations", () => {
  for (const next of [
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "%2F%2Fevil.example",
    "/redefinir-senha?next=https://evil.example",
  ]) {
    assert.equal(authDestination(next), "/workspace");
  }
  assert.equal(authDestination("/redefinir-senha"), "/redefinir-senha");
  assert.equal(
    authDestination("https://evil.example", true),
    "/redefinir-senha",
  );
});
