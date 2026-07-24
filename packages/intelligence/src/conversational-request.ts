/**
 * ConversationalRequest: User input to Victoroff.ai
 *
 * Represents a question from a user in the Victoroff.ai conversational interface.
 * Does not store PII. Anonymous by default.
 */
export interface ConversationalRequest {
  /** Unique session identifier (temporary, for conversation continuity) */
  sessionId: string;

  /** Unique request identifier within the session */
  requestId: string;

  /** User's natural-language question */
  userQuestion: string;

  /** When the request was received */
  timestamp: Date;

  /** Optional: user's preferred interface language (ISO 639-1 code) */
  preferredLanguage?: string;

  /** Optional: user-supplied context or previous question (for multi-turn) */
  conversationContext?: string;
}

export function validateConversationalRequest(req: unknown): req is ConversationalRequest {
  if (typeof req !== 'object' || req === null) return false;
  const r = req as Record<string, unknown>;
  return (
    typeof r.sessionId === 'string' &&
    r.sessionId.length > 0 &&
    typeof r.requestId === 'string' &&
    r.requestId.length > 0 &&
    typeof r.userQuestion === 'string' &&
    r.userQuestion.length > 0 &&
    r.timestamp instanceof Date &&
    !isNaN(r.timestamp.getTime())
  );
}
