import { test } from "node:test";
import assert from "node:assert/strict";
import {
  correlateOfferReply,
  normalizeOfferSubject,
} from "../src/lib/email-tracking.ts";
const sent = {
  organizationId: "org-a",
  mailboxId: "box-a",
  recipientId: "recipient-v1",
  subject: "[OR-2026-001-V1-R01] Oferta patrimonial",
  trackingCode: "OR-2026-001-V1-R01",
  conversationId: "conversation-a",
  messageIds: ["<sent-v1@example.com>"],
  expectedSenders: ["market@example.com"],
  sentAt: "2026-10-08T15:00:00Z",
};
const received = {
  organizationId: "org-a",
  mailboxId: "box-a",
  subject: `RE: ${sent.subject}`,
  sender: "market@example.com",
  receivedAt: "2026-10-08T16:00:00Z",
};
const version2 = {
  ...sent,
  recipientId: "recipient-v2",
  trackingCode: "OR-2026-001-V2-R01",
  messageIds: ["<sent-v2@example.com>"],
  subject: "[OR-2026-001-V2-R01] Oferta patrimonial",
};
test("reply headers identify the exact version even with changed subject and same conversation", () => {
  const match = correlateOfferReply(
    {
      ...received,
      subject: "Dúvida sobre o contrato",
      inReplyTo: "<sent-v2@example.com>",
      conversationId: sent.conversationId,
    },
    [sent, version2],
  );
  assert.equal(match.state, "matched");
  assert.deepEqual(match.recipientIds, ["recipient-v2"]);
  assert.equal(match.reason, "reply_header");
});
test("whole tracking tokens match; substrings and received dates before sending do not", () => {
  assert.equal(correlateOfferReply(received, [sent]).state, "matched");
  assert.equal(
    correlateOfferReply(
      { ...received, subject: "[OR-2026-001-V1-R010] Outra" },
      [sent],
    ).state,
    "unmatched",
  );
  assert.equal(
    correlateOfferReply({ ...received, receivedAt: "2026-10-07T16:00:00Z" }, [
      sent,
    ]).state,
    "unmatched",
  );
  assert.equal(
    correlateOfferReply({ ...received, receivedAt: "invalid" }, [sent]).reason,
    "invalid_date",
  );
});
test("headers conflicting with subject code and ambiguous conversations require review", () => {
  const conflict = correlateOfferReply(
    { ...received, inReplyTo: version2.messageIds[0] },
    [sent, version2],
  );
  assert.equal(conflict.reason, "conflicting_signals");
  assert.equal(conflict.state, "review");
  const conversation = correlateOfferReply(
    { ...received, subject: "Retorno", conversationId: sent.conversationId },
    [sent, version2],
  );
  assert.equal(conversation.state, "review");
  assert.equal(conversation.reason, "ambiguous");
});
test("unknown market contacts and automatic messages are never treated as confirmed replies", () => {
  assert.equal(
    correlateOfferReply({ ...received, sender: "another@example.com" }, [sent])
      .reason,
    "unknown_sender",
  );
  assert.equal(
    correlateOfferReply({ ...received, automatic: true }, [sent]).reason,
    "automatic_message",
  );
});
test("subject-only and indirect references yield suggestions requiring review", () => {
  const legacy = {
    ...sent,
    subject: "Oferta patrimonial",
    trackingCode: undefined,
  };
  assert.equal(
    normalizeOfferSubject("RE: RES: Enc: Oferta   patrimonial"),
    "oferta patrimonial",
  );
  const result = correlateOfferReply(
    { ...received, subject: "RE: Oferta patrimonial" },
    [legacy],
  );
  assert.equal(result.state, "review");
  assert.equal(result.reason, "subject");
  assert.equal(
    correlateOfferReply(
      {
        ...received,
        subject: "Enc: Oferta patrimonial",
        references: [sent.messageIds[0]],
      },
      [sent],
    ).state,
    "review",
  );
  assert.equal(
    correlateOfferReply(
      { ...received, subject: "Oferta patrimonial urgente" },
      [legacy],
    ).state,
    "unmatched",
  );
});
test("correlation never crosses tenant or mailbox boundaries", () => {
  assert.equal(
    correlateOfferReply({ ...received, organizationId: "org-b" }, [sent]).state,
    "unmatched",
  );
  assert.equal(
    correlateOfferReply({ ...received, mailboxId: "box-b" }, [sent]).state,
    "unmatched",
  );
  const other = { ...sent, organizationId: "org-b", recipientId: "foreign" };
  assert.deepEqual(correlateOfferReply(received, [sent, other]).recipientIds, [
    "recipient-v1",
  ]);
});
