import { test } from "node:test";
import assert from "node:assert/strict";
import { emptySetup, validateSetup } from "../src/lib/onboarding.ts";
test("activation permits partial drafts but requires company and responsible on completion", () => {
  assert.ok(validateSetup(emptySetup(), false).payload);
  assert.ok(validateSetup(emptySetup(), true).error);
  const minimal = emptySetup("Empresa", "ana@example.com", "Ana");
  assert.ok(validateSetup(minimal, true).payload);
  assert.ok(validateSetup({ ...minimal, email: "errado" }, true).error);
  assert.ok(
    validateSetup({ ...minimal, cnpj: "12.ABC.345/0001-99" }, true).payload,
  );
});
test("activation rejects duplicate sectors, malformed lines and oversized/invalid preferences", () => {
  const payload = emptySetup("Empresa", "ana@example.com", "Ana");
  const sector = {
    name: "Property",
    area: "facultative",
    lines: ["Engenharia"],
  };
  assert.ok(
    validateSetup(
      { ...payload, sectors: [sector, { ...sector, name: " property " }] },
      true,
    ).error,
  );
  assert.ok(
    validateSetup(
      { ...payload, sectors: [{ ...sector, lines: ["Property", "property"] }] },
      true,
    ).error,
  );
  assert.ok(
    validateSetup(
      { ...payload, sectors: [{ ...sector, id: "malformado" }] },
      true,
    ).error,
  );
  assert.ok(validateSetup({ ...payload, pain: "x".repeat(1001) }, false).error);
  assert.ok(validateSetup({ ...payload, outlook: "imaginary" }, false).error);
  assert.ok(validateSetup({ ...payload, evidence: [null] }, false).error);
  const result = validateSetup(
    { ...payload, areas: ["treaty", "treaty"], sectors: [sector] },
    true,
  );
  assert.deepEqual(result.payload.areas, ["treaty"]);
});
