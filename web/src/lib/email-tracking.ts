/** Provider-neutral correlation only. No mailbox access, storage or business classification. */
export type TrackedOfferMail = {
  organizationId: string;
  mailboxId: string;
  recipientId: string; // Identifies the recipient of a specific offer version.
  subject: string;
  trackingCode?: string;
  conversationId?: string;
  messageIds: string[]; // Sent message and already linked replies, as RFC Message-ID values.
  expectedSenders: string[];
  sentAt: string;
};
export type IncomingOfferMail = {
  organizationId: string; // Must come from the authorized connection, never the email payload.
  mailboxId: string;
  subject: string;
  sender: string;
  receivedAt: string;
  inReplyTo?: string;
  references?: string[];
  conversationId?: string;
  automatic?: boolean;
};
export type MailCorrelation = {
  state: "matched" | "review" | "unmatched";
  recipientIds: string[];
  reason: "reply_header" | "tracking_code" | "conversation" | "subject" | "conflicting_signals" | "ambiguous" | "unknown_sender" | "automatic_message" | "invalid_date" | "no_match";
};
export function normalizeOfferSubject(subject: string): string {
  let text = subject.normalize("NFKC").trim();
  // Only remove common reply/forward prefixes; never use substring matching.
  while (/^(?:re|res|fw|fwd|enc)\s*:\s*/i.test(text)) text = text.replace(/^(?:re|res|fw|fwd|enc)\s*:\s*/i, "");
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}
export function correlateOfferReply(mail: IncomingOfferMail, tracked: TrackedOfferMail[]): MailCorrelation {
  const result = (state: MailCorrelation["state"], candidates: TrackedOfferMail[], reason: MailCorrelation["reason"]): MailCorrelation => ({ state, recipientIds: [...new Set(candidates.map(c => c.recipientId))], reason });
  const received = Date.parse(mail.receivedAt);
  if (!Number.isFinite(received)) return result("review", [], "invalid_date");
  const eligible = tracked.filter(c => c.organizationId === mail.organizationId && c.mailboxId === mail.mailboxId && Number.isFinite(Date.parse(c.sentAt)) && Date.parse(c.sentAt) <= received);
  const byMessageId = (id: string) => eligible.filter(c => c.messageIds.some(known => known.trim() === id.trim()));
  // Immediate parent identifies the version more precisely than the whole conversation.
  let headers = mail.inReplyTo?.trim() ? byMessageId(mail.inReplyTo) : [];
  let indirect = false;
  if (!headers.length) {
    for (const id of [...(mail.references ?? [])].reverse()) {
      const matched = byMessageId(id);
      if (matched.length) { headers = matched; indirect = true; break; }
    }
  }
  // Codes are registered for a recipient/version and matched as complete bracketed tokens.
  const tokens = new Set(Array.from(mail.subject.matchAll(/\[([^\[\]\r\n]+)\]/g), m => m[1]));
  const codes = eligible.filter(c => c.trackingCode && tokens.has(c.trackingCode));
  const senderKnown = (c: TrackedOfferMail) => c.expectedSenders.some(address => address.trim().toLowerCase() === mail.sender.trim().toLowerCase());
  function finish(candidates: TrackedOfferMail[], reason: MailCorrelation["reason"], forceReview = false) {
    if (new Set(candidates.map(c => c.recipientId)).size !== 1) return result("review", candidates, "ambiguous");
    if (mail.automatic) return result("review", candidates, "automatic_message");
    if (!candidates.every(senderKnown)) return result("review", candidates, "unknown_sender");
    return result(forceReview ? "review" : "matched", candidates, reason);
  }
  if (headers.length && codes.length) {
    const a = new Set(headers.map(c => c.recipientId)), b = new Set(codes.map(c => c.recipientId));
    if (a.size !== b.size || [...a].some(id => !b.has(id))) return result("review", [...headers, ...codes], "conflicting_signals");
  }
  if (headers.length) return finish(headers, "reply_header", indirect);
  if (codes.length) return finish(codes, "tracking_code");
  // A conversation can contain different offers/versions; no automatic choice in that case.
  const conversations = mail.conversationId ? eligible.filter(c => c.conversationId === mail.conversationId) : [];
  if (conversations.length) return finish(conversations, "conversation");
  const subject = normalizeOfferSubject(mail.subject);
  const subjects = subject ? eligible.filter(c => normalizeOfferSubject(c.subject) === subject && senderKnown(c)) : [];
  if (subjects.length) return finish(subjects, "subject", true);
  return result("unmatched", [], "no_match");
}
