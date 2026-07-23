# Victoroff.ai gap analysis

This analysis compares the evidence in docs/current-state.md with the proposed target in
docs/target-architecture.md. All implementation remains uncommissioned and synthetic until the
authority and custody predicates release a narrower mode.

## Priority gaps

| Priority | Capability | Current evidence | Required closure | Verification |
|---|---|---|---|---|
| P0 | Governing source | Constitution v1.0.0 is named but unavailable; one synthetic checksum manifest exists | Obtain an authorized source and checksum or keep every new rule explicitly proposed and subordinate | Documentation tests reject invented availability or authority |
| P0 | Program truth | First canaries are merged and reconciled; later TABVLARIVS tasks are not registry packets | Register one dependency-safe packet per owner and prevent overlapping active paths | pnpm verify:control |
| P1 | Canonical model | Shareholder and governance contracts only | Versioned contracts for entities, aliases, domain membership, relationships, sources, snapshots, claims, support, contradictions, permissions, reviews, and audit events | Contract tests and typecheck |
| P1 | Provenance | Public actions carry one source URL; publication receipts preserve package state | Source to extraction to claim to entity or relationship to analysis lineage, including passage location, method, confidence, verification, and last checked date | Provenance-chain and contradiction tests |
| P1 | Authorization | Lifecycle role checks exist; no authenticated request or record filtering exists | Server-side subject, action, resource, organization, domain, classification, and project checks with default deny | Restricted-record isolation tests |
| P1 | Persistence | No database or migrations | Repository ports plus local SQLite migrations, foreign keys, revisions, append-only audit, and transaction tests | Clean migration, restart, and isolation predicate |
| P2 | Entity resolution | None | Canonical names, aliases, external identifiers, candidate matches, merge review, reversible decisions, and relationship preservation | Duplicate and ambiguous-merge tests |
| P2 | Relationship traversal | No institutional graph | First-class typed, temporal, sourced relationships spanning all domains without entity duplication | Cross-domain traversal tests |
| P2 | Search | No structured, full-text, semantic, or graph search | Permission-filtered structured queries, SQLite FTS5, and bounded graph traversal behind one retrieval interface | Search relevance and restricted-data tests |
| P2 | Ingestion | Static hand-written fixtures only | Connector interface, raw-source custody, extraction, normalization, claim staging, entity suggestions, review, and publication states | Idempotency and replay tests with approved synthetic fixtures |
| P2 | Internal application | apps/os and services/api are absent | Seven-intent internal front door, evidence views, record inspection, and command/query API | Critical journey end-to-end tests |
| P3 | AI answers | No model integration | Retrieval-first evidence envelope, claim-level citations, fact/inference separation, uncertainty, contradiction display, and no authoritative writes | Grounding and prompt-injection tests |
| P3 | Change detection | Source expiry exists only for public actions | Source snapshots, material diffs, stale-source queues, and user review checkpoints | Deterministic change-detection tests |
| P3 | Calendar and email | No adapters | Permission-scoped adapter ports and normalized operational records; no live credentials until separately authorized | Contract tests with synthetic adapters |
| P4 | Production readiness | Static concept only; custody holds active | Authorized identity, secrets, telemetry, rate limits, backup/restore, incident response, privacy review, performance, and deployment receipts | Phase-specific release predicate after authority release |

## Architectural risks

### Premature graph or vector infrastructure

A separate graph database and vector service would add operational burden before the data volume,
query distribution, and relevance evidence justify them. SQLite tables, recursive queries, and FTS5
are sufficient for the first synthetic vertical slice. Upgrade ports must exist, but infrastructure
must be earned by measured limits.

### Domain silos

Creating five databases or five copies of the same organization would make cross-domain questions
unreliable. Domains must be memberships or lenses over shared canonical entities and relationships.

### AI authority leakage

Letting generated summaries become records would collapse source, claim, and analysis boundaries.
AI outputs must remain suggestions or analyses with model-run provenance and cannot approve, merge,
release, or establish governing truth.

### Permission leakage through retrieval

Filtering only the final prose is insufficient. Authorization must constrain candidate retrieval,
relationship traversal, document access, snippets, caches, and citations before model invocation and
must be checked again before response delivery.

### Invisible entity merges

An incorrect merge can corrupt every relationship and historical answer. High-impact or ambiguous
matches require review, preserve both source records, and produce reversible merge decisions.

## Dependency conclusion

The first build dependency after this documentation packet is VIC-INTEL-CONTRACTS-001. Persistence,
search, ingestion, UI, and AI work must not invent their own competing entity or provenance shapes.
