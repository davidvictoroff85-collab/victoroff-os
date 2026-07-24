/**
 * KnowledgeRetrievalRequest: Bounded retrieval request based on classified intent
 */
export interface KnowledgeRetrievalRequest {
  /** Reference to classified intent */
  intentRequestId: string;

  /** The classified intent category */
  category: string; // IntentCategory

  /** Entities extracted from user question for filtering */
  extractedEntities: Record<string, string | string[]>;

  /** Session ID for conversation continuity */
  sessionId: string;

  /** When retrieval was requested */
  timestamp: Date;
}

/**
 * KnowledgeChunk: Individual piece of knowledge with source attribution
 */
export interface KnowledgeChunk {
  /** The answer/information content */
  content: string;

  /** Source metadata (required for provenance) */
  source: {
    sourceId: string;
    organisation: string;
    sourceUrl: string;
    retrievedDate: Date;
    verificationStatus: 'verified' | 'unreviewed' | 'disputed';
    authorityLevel: 'definitive' | 'advisory' | 'provisional';
  };

  /** When this knowledge was retrieved from source */
  retrievedAt: Date;

  /** Classification of information type */
  infoClass:
    | 'verified-institutional'
    | 'verified-cultural'
    | 'current-opportunities'
    | 'general-explanation'
    | 'unknown';

  /** Confidence in this chunk (high/medium/low) */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * KnowledgeRetrievalResult: Result of knowledge retrieval
 */
export interface KnowledgeRetrievalResult {
  /** Reference to retrieval request */
  requestId: string;

  /** Overall confidence level */
  confidenceLevel: 'high' | 'medium' | 'low';

  /** Freshness of retrieved information */
  freshness: 'current' | 'stale' | 'expired';

  /** Primary answer chunk (if available) */
  primaryAnswer: KnowledgeChunk | null;

  /** Related answer chunks (supplementary information) */
  relatedAnswers: KnowledgeChunk[];

  /** Conflicting answer chunks (if sources disagree) */
  conflictingAnswers: KnowledgeChunk[];

  /** Recommended fallback action if insufficient knowledge */
  fallbackAction: {
    type: 'answer' | 'partial-answer' | 'dont-know' | 'handoff';
    message: string;
  };
}
