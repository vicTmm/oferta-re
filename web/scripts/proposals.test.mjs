import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isOverdue,
  upcomingRenewal,
  brazilToday,
  expiringCoverage,
} from "../src/lib/proposals.ts";
test("proposal deadlines use Brasília calendar days and exclude concluded proposals", () => {
  assert.equal(brazilToday(new Date("2026-10-09T01:00:00Z")), "2026-10-08");
  assert.equal(
    isOverdue({ stage: "market", due_date: "2026-10-07" }, "2026-10-08"),
    true,
  );
  assert.equal(
    isOverdue({ stage: "review", due_date: "2026-10-08" }, "2026-10-08"),
    false,
  );
  for (const stage of ["placed", "not_placed", "cancelled", "closed"])
    assert.equal(
      isOverdue({ stage, due_date: "2026-01-01" }, "2026-10-08"),
      false,
    );
});
test("upcoming renewals count the next 30 days without mixing expired deadlines or new business", () => {
  const p = {
    stage: "market",
    business_kind: "renewal",
    due_date: "2026-11-07",
  };
  assert.equal(upcomingRenewal(p, "2026-10-08"), true);
  assert.equal(
    upcomingRenewal({ ...p, due_date: "2026-11-08" }, "2026-10-08"),
    false,
  );
  assert.equal(
    upcomingRenewal({ ...p, due_date: "2026-10-07" }, "2026-10-08"),
    false,
  );
  assert.equal(
    upcomingRenewal({ ...p, business_kind: "new_business" }, "2026-10-08"),
    false,
  );
});

test("expiring coverage highlights placed periods without assuming a proposal was contracted", () => {
  const p = { stage: "placed", coverage_end: "2026-11-07" };
  assert.equal(expiringCoverage(p, "2026-10-08"), true);
  assert.equal(
    expiringCoverage({ ...p, stage: "market" }, "2026-10-08"),
    false,
  );
  assert.equal(
    expiringCoverage({ ...p, coverage_end: "2026-10-07" }, "2026-10-08"),
    false,
  );
  assert.equal(
    expiringCoverage({ ...p, coverage_end: "2026-11-08" }, "2026-10-08"),
    false,
  );
});
