# Victoroff.ai Intelligence Architecture

## Phase 1 Objective

Establish a conversational shareholder intelligence system that:

1. Accepts natural-language questions from shareholders
2. Classifies user intent into bounded categories
3. Retrieves information from authorized, provenance-tracked sources
4. Evaluates confidence and source authority
5. Returns answers with explicit source attribution and provenance
6. Gracefully handles unknowns and unsupported claims
7. Never manufactures institutional eligibility, deadlines, benefits, Dena'ina translations, or authoritative guidance

## Architectural Principles

### Provenance-First Design

Every piece of information has a verified source record containing:
- Source ID (unique identifier)
- Organization (issuer or maintainer)
- Source URL (canonical reference)
- Source type (institutional, cultural, opportunity-data, external)
- Retrieved date (when we fetched it)
- Effective date (when the information becomes valid)
- Expiration/review date (when it must be re-verified)
- Authority level (definitive, advisory, provisional)
- Verification status (verified, unreviewed, disputed)

### Trust Boundaries

```
User Input
    ↓
[Public Interface]
    ↓
Intent Classification (no external calls)
    ↓
[Authorization Gate] ← Permitted categories only
    ↓
Authorized Knowledge Retrieval
    ├─ Institutional information (BBNC, partner systems)
    ├─ Verified cultural/language knowledge (Dena'ina)
    ├─ Current external opportunities (jobs, scholarships)
    └─ General AI explanation (education, conceptual)
    ↓
[Source Authority Evaluation]
    ├─ Confidence level (high, medium, low)
    ├─ Freshness (current, stale, expired)
    └─ Competing/conflicting sources
    ↓
Reasoning & Synthesis (model-agnostic)
    ↓
Response Generation
    ↓
Source Presentation (always)
    │   - Source name
    │   - Last verified date
    │   - Authority/status
    │   - Official destination link
    ↓
[Optional Handoff] ← Human-directed only
    ├─ myBBNC (authenticated shareholder record)
    ├─ Partner system (job application, scholarship portal)
    └─ Staff contact (direct assistance needed)
```

### Five Information Classes

1. **Verified Institutional Information**
   - BBNC benefits, programs, eligibility rules
   - Partner organization offerings (documented partnerships)
   - Official deadlines and application processes
   - Authority: Definitive
   - Example: "BBNC Shareholder Education Assistance offers up to $X per fiscal year"

2. **Verified Cultural/Language Knowledge**
   - Dena'ina vocabulary, pronunciation, grammar
   - Cultural context, traditional practices, seasonal knowledge
   - Authority: Contributors/elders reviewed; source cited
   - Example: "Dena'ina term for 'grandmother' is [term]; pronounced [guide]"

3. **Current External Opportunities**
   - Job listings from labor boards, partner employers
   - Scholarship databases (third-party verified)
   - Training/education programs (accredited, current)
   - Authority: Hourly/daily refresh; freshness explicit
   - Example: "Alaska Department of Labor reports [N] active opportunities matching your criteria"

4. **General AI Explanation**
   - Career readiness concepts
   - Financial literacy principles
   - Educational pathway guidance
   - Authority: Conceptual; no personal eligibility claim
   - Example: "Financial literacy typically covers budgeting, savings, credit, and investing"

5. **Unknown or Insufficiently Supported**
   - No source available
   - Conflicting sources
   - Expired or stale information
   - Authority: None; always defer
   - Example: "I don't have verified information about that. You can contact [official channel] directly"

## Retrieval Flow

### 1. Question → Intent Classification

```typescript
interface ConversationalRequest {
  userId?: string; // Anonymous by default
  sessionId: string;
  userQuestion: string;
  timestamp: Date;
}

interface ClassifiedIntent {
  requestId: string;
  category: IntentCategory;
  confidence: number; // 0-1
  extractedEntities: Record<string, string | string[]>;
  reasoning: string;
}

enum IntentCategory {
  FindOpportunities = "find-opportunities",
  EducationScholarships = "education-scholarships",
  JobsTraining = "jobs-training",
  FinancialLiteracy = "financial-literacy",
  LearnDenaina = "learn-denaina",
  ShareholderResources = "shareholder-resources",
  Unknown = "unknown",
}
```

### 2. Intent → Authorized Knowledge Retrieval

Based on classified intent, invoke bounded retrieval contracts:

```typescript
interface KnowledgeRetrievalRequest {
  intent: IntentCategory;
  extractedEntities: Record<string, string | string[]>;
  sessionId: string;
  timestamp: Date;
}

interface KnowledgeRetrievalResult {
  requestId: string;
  confidenceLevel: "high" | "medium" | "low";
  freshness: "current" | "stale" | "expired";
  primaryAnswer: KnowledgeChunk | null;
  relatedAnswers: KnowledgeChunk[];
  conflictingAnswers: KnowledgeChunk[];
  fallbackAction: FallbackAction;
}

interface KnowledgeChunk {
  content: string;
  source: KnowledgeSource;
  retrievedAt: Date;
  infoClass: InformationClass;
  confidence: "high" | "medium" | "low";
}

enum InformationClass {
  VerifiedInstitutional = "verified-institutional",
  VerifiedCultural = "verified-cultural",
  CurrentOpportunities = "current-opportunities",
  GeneralExplanation = "general-explanation",
  Unknown = "unknown",
}
```

### 3. Knowledge Source Record (Provenance)

```typescript
interface KnowledgeSource {
  sourceId: string; // UUID
  organization: string;
  sourceUrl: string;
  sourceType: "institutional" | "cultural" | "opportunity-data" | "external";
  topic: string;
  retrievedDate: Date;
  effectiveDate: Date | null;
  expirationDate: Date | null;
  reviewDate: Date | null;
  authorityLevel: "definitive" | "advisory" | "provisional";
  verificationStatus: "verified" | "unreviewed" | "disputed";
  citationInfo: {
    title?: string;
    author?: string;
    publicationDate?: Date;
    url: string;
  };
  jurisdiction?: string;
  programme?: string;
  contentHash: string; // SHA-256 of content for integrity
  notes?: string;
}
```

### 4. Answer Confidence & Status Evaluation

```typescript
interface AnswerEvaluation {
  supportLevel: "fully-supported" | "partially-supported" | "unsupported";
  confidence: "high" | "medium" | "low";
  freshness: "current" | "stale" | "expired";
  sources: KnowledgeSource[];
  conflictingSourcesCount: number;
  recommendedAction: "answer" | "defer" | "handoff";
}
```

### 5. Safe Fallback Behavior

```typescript
interface FallbackAction {
  type: "answer" | "partial-answer" | "dont-know" | "handoff";
  message: string;
  reasoning: string;
  handoffTarget?: "mybbncrecord" | "partner-system" | "staff-contact";
  handoffUrl?: string;
}
```

## Privacy Model (Phase 1)

### What We Store

- Session ID (temporary, for conversation continuity)
- Conversation history (questions and responses only)
- Timestamp and intent classification (for verification/audit)

### What We Do NOT Store

- Real shareholder identity
- PII (names, contact info, financial data, family structure)
- Assessment or eligibility determinations
- Learner data or learning progress
- Authentication credentials
- Form submissions or applications

### Where Data Lives

- Conversational context: Ephemeral, cleared after session
- Verification logs: Internal audit trail only (BBNC staff access)
- Knowledge sources: Public or BBNC-verified only
- Analytics: Aggregated, anonymized intent distribution

## Source Authority Model

### Institutional Information Authority Hierarchy

1. **BBNC Official Documents** (Definitive)
   - Published policies, procedures, benefit amounts
   - Annual updates, official amendments
   - Sourced from BBNC governance

2. **BBNC Stewardship Verification** (Advisory)
   - Staff-reviewed external partner agreements
   - Confirmed deadlines and eligibility rules
   - Time-limited (must refresh annually)

3. **External Partner Official Sources** (Advisory)
   - Direct feeds from partner organizations
   - Job boards, scholarship databases
   - Hourly refresh for opportunity data

4. **Provisional/Unreviewed** (Low confidence)
   - Content awaiting BBNC verification
   - Flagged as `verificationStatus: "unreviewed"`
   - Never presented as authoritative

### Dena'ina Language Authority

- Only contributor-reviewed content is presented as "verified"
- All sources attributed to elders, linguists, cultural authorities
- Content licensed with explicit rights/permissions
- New submissions require review before integration
- Dialect variations documented and labeled

## Future Authenticated Boundary

When BBNC introduces authenticated shareholder records in Phase 5+:

- MyBBNC login gate (optional)
- Personalized eligibility determinations
- Private scholarship applications
- Learning progress tracking
- Account preferences and saved results

This Phase 1 implementation **does not** introduce these—only the architectural boundaries to support them later.

## Opportunity-Data Freshness Requirements

### Jobs & Training

- Refresh: Daily
- Stale threshold: > 7 days
- Expired threshold: > 30 days (removed from results)
- Sources: Alaska Department of Labor, partner employers, training providers

### Scholarships & Grants

- Refresh: Weekly
- Stale threshold: > 14 days
- Expired threshold: > 60 days (past application deadline)
- Sources: Verified scholarship databases, BBNC partner programs

### Workshops & Events

- Refresh: Monthly
- Stale threshold: > 30 days
- Expired threshold: > 90 days or past date
- Sources: BBNC calendars, partner organizations, community calendars

### Financial Literacy Resources

- Refresh: Quarterly
- Stale threshold: > 6 months
- Expired threshold: > 12 months (conceptual content is more durable)
- Sources: BBNC publications, accredited financial educators

## Evaluation Coverage

The Phase 1 verification suite must catch:

1. ✅ **Unsupported benefit claim** – Response correctly says "I don't know" when no source exists
2. ✅ **Expired scholarship** – Response flags deadline as past; removes from results
3. ✅ **Stale job posting** – Response indicates last verified date; may suggest refresh
4. ✅ **Invented deadline** – System never manufactures dates; requires source
5. ✅ **Unsupported eligibility determination** – Response rejects personal eligibility claims without institutional source
6. ✅ **Missing source** – Every factual claim has an attributed source
7. ✅ **Conflicting sources** – System presents contradictions, doesn't suppress; recommends handoff
8. ✅ **Attempted invented Dena'ina translation** – Rejects unreviewed vocabulary; flags as "unverified"
9. ✅ **Unreviewed cultural content** – Presents with `verificationStatus: "unreviewed"` label; suggests staff review
10. ✅ **Correct "I don't know" behavior** – Prioritizes accuracy over guessing; always offers handoff

## Implementation Constraints

### Public/Private Dependency Boundary

The public `@victoroff/site` application **must NOT**:

- Import from `@victoroff/domain` (internal authority rules)
- Import from `@victoroff/publication` (internal signing/withdrawal)
- Access shareholder records or stewardship workflows
- Store credentials, authentication state, or PII
- Submit applications or external requests directly

The public app **may** import:

- `@victoroff/contracts` (OpenAPI/JSON Schema)
- `@victoroff/fixtures` (public source records)
- `@victoroff/ui` (accessible primitives)
- `@victoroff/intelligence` (Phase 1 new package)
- `@victoroff/knowledge` (Phase 1 new package)
- `@victoroff/opportunities` (Phase 1 new package)

### Model Vendor Neutrality

The `@victoroff/intelligence` package defines request/response contracts but **does not**:

- Depend on a specific LLM vendor (OpenAI, Anthropic, etc.)
- Require API credentials in the package
- Couple intent classification to a particular model

This allows BBNC to choose models independently in Phase 3+ (API infrastructure).

## Deployment Considerations

### Public Site (Static)

- No authentication required
- Conversational interface is read-only
- Suggests prompts: "Find opportunities", "Education & scholarships", "Jobs & training", "Financial literacy", "Learn Dena'ina", "Shareholder resources"
- Knowledge sources updated via build-time fixtures

### Staff Demo (Restricted)

- Access limited to BBNC staff
- Ability to curate, verify, and review pending content
- Audit logs for source updates
- Not exposed to public

### Future API (Phase 3)

- Authenticated endpoint for integrated clients
- Rate limiting and audit trail
- Exact-revision knowledge source binding

## Known Unknowns & Phase 2 Decisions

1. **Model Selection** – Which LLM for intent classification and synthesis? (Phase 2)
2. **Real-time Opportunity Feeds** – How do we ingest job/scholarship data continuously? (Phase 2)
3. **Dena'ina Content Governance** – Who reviews and approves new vocabulary? (Phase 2, BBNC decision)
4. **Personalization Without PII** – Can we offer personalized suggestions without storing identity? (Phase 2 research)
5. **Multi-language Support** – Beyond Dena'ina, how do we support other Alaska Native languages? (Phase 3+)
6. **Accessibility of Conversational Interface** – How do we ensure chat interface meets WCAG 2.1 AA? (Phase 2 audit)

## References

- **Architecture:** `docs/architecture.md` (existing concentric rings)
- **Phase Plan:** `docs/phase-plan.md` (Phase 0–9 delivery contract)
- **Contracts:** `packages/contracts/openapi.v1.yaml` (API boundaries)
- **Publication:** `packages/publication` (source verification model)
