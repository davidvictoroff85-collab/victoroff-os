/**
 * ClassifiedIntent: Result of intent classification
 *
 * Categorizes user's question into one of bounded intent categories.
 * Extracted entities support retrieval filtering.
 */
export interface ClassifiedIntent {
  /** Reference back to original request */
  requestId: string;

  /** Classified intent category */
  category: IntentCategory;

  /** Confidence in classification (0-1) */
  confidence: number;

  /** Extracted entities from question (e.g., job_title, location, topic) */
  extractedEntities: Record<string, string | string[]>;

  /** Internal reasoning for classification (for audit/debugging) */
  reasoning: string;

  /** When classification was performed */
  timestamp: Date;
}

/**
 * IntentCategory: Bounded intent categories for Victoroff.ai Phase 1
 */
export enum IntentCategory {
  /** User seeking job, internship, or training opportunities */
  FindOpportunities = 'find-opportunities',

  /** User asking about education, scholarships, or grants */
  EducationScholarships = 'education-scholarships',

  /** User asking about jobs, training, or workforce development */
  JobsTraining = 'jobs-training',

  /** User seeking financial literacy or financial guidance */
  FinancialLiteracy = 'financial-literacy',

  /** User wanting to learn Dena'ina or other language */
  LearnLanguage = 'learn-language',

  /** User asking about shareholder programs, benefits, resources */
  ShareholderResources = 'shareholder-resources',

  /** User asking for explanation or guidance on concepts */
  ExplainConcept = 'explain-concept',

  /** Could not classify into supported intent categories */
  Unknown = 'unknown',
}

export function validateClassifiedIntent(intent: unknown): intent is ClassifiedIntent {
  if (typeof intent !== 'object' || intent === null) return false;
  const i = intent as Record<string, unknown>;
  const validCategories = Object.values(IntentCategory);
  return (
    typeof i.requestId === 'string' &&
    validCategories.includes(i.category as IntentCategory) &&
    typeof i.confidence === 'number' &&
    i.confidence >= 0 &&
    i.confidence <= 1 &&
    typeof i.extractedEntities === 'object' &&
    typeof i.reasoning === 'string' &&
    i.timestamp instanceof Date
  );
}
