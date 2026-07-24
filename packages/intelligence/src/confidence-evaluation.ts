/**
 * AnswerEvaluation: Assessment of answer quality and support level
 */
export interface AnswerEvaluation {
  /** How well supported is the answer */
  supportLevel: 'fully-supported' | 'partially-supported' | 'unsupported';

  /** Confidence in the answer */
  confidence: 'high' | 'medium' | 'low';

  /** Freshness of source information */
  freshness: 'current' | 'stale' | 'expired';

  /** Number of supporting sources */
  supportingSourceCount: number;

  /** Number of conflicting sources */
  conflictingSourcesCount: number;

  /** Recommended action based on evaluation */
  recommendedAction: 'answer' | 'defer' | 'handoff';

  /** Reasoning for the recommendation */
  reasoning: string;
}

/**
 * Evaluation rules for safety and accuracy
 */
export const EVALUATION_RULES = {
  /** Minimum sources required for "high confidence" institutional answer */
  MIN_SOURCES_HIGH_CONFIDENCE: 2,

  /** Maximum age before opportunity is considered "stale" */
  STALE_OPPORTUNITY_DAYS: 7,

  /** Maximum age before opportunity is considered "expired" */
  EXPIRED_OPPORTUNITY_DAYS: 30,

  /** Maximum age before scholarship deadline info is considered "stale" */
  STALE_SCHOLARSHIP_DAYS: 14,

  /** Maximum age before scholarship deadline info is considered "expired" */
  EXPIRED_SCHOLARSHIP_DAYS: 60,

  /** Minimum confidence required to answer without offer of handoff */
  MIN_CONFIDENCE_TO_ANSWER: 0.6,
};
