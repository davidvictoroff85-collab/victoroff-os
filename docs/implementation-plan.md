# Victoroff.ai implementation plan

This plan is dependency-ordered, packetized, and synthetic-first. A phase may begin only after its
dependency has a merged, predicate-green remote receipt. A created PR or prose completion claim is
not a dependency receipt.

## Material deviation from the master sequence

The master directive separates core schema, provenance, and relationships into three phases. The
repository should define those contracts together before persistence because their identifiers and
cardinality are mutually dependent. Persistence then precedes search, ingestion, UI, and AI so
authorization and provenance can be tested at the storage boundary. This is a dependency adjustment,
not a reduction in scope.

## Phase 0 — Audit and control stabilization

State: complete through PR #21 and this documentation packet.

- Reconcile merged canary receipts.
- Record the directive as proposed subordinate architecture.
- Classify and own the four architecture documents and ADR paths.
- Preserve PR #11 as an owner-held integration packet.
- Establish executable documentation assertions.

Predicate: pnpm verify:control plus node --test docs/adr/*.test.mjs.

## Phase 1 — Canonical intelligence contracts

Packet: VIC-INTEL-CONTRACTS-001.

- Add versioned schemas and TypeScript types for Entity, EntityAlias, DomainMembership,
  Relationship, Source, SourceSnapshot, ExtractedRecord, Claim, ClaimSupport, Analysis,
  PermissionGrant, ReviewDecision, and institutional AuditEvent.
- Define classification, verification, confidence, temporal validity, revision, and provenance
  invariants.
- Represent contradictory support explicitly.
- Keep domain membership separate from canonical identity.
- Add valid and adversarial fixtures without real identities or records.

Allowed paths: packages/contracts/**.

Predicate: pnpm --filter @victoroff/contracts test && pnpm --filter @victoroff/contracts typecheck.

## Phase 2 — SQLite persistence and isolation

Packet: VIC-INTEL-PERSISTENCE-001.

- Create repository ports and a local SQLite adapter.
- Add ordered migrations, foreign keys, revision checks, append-only audit, source snapshot custody,
  contradiction support, and transactional merge review.
- Prove empty-database setup, upgrade from the previous schema, restart durability, idempotent writes,
  and restricted-record isolation.
- Do not add PostgreSQL runtime infrastructure; preserve the adapter boundary only.

Allowed paths: packages/persistence/** after workspace integration is assigned to a separate named
integration packet.

Predicate: package tests, typecheck, migration-from-empty, migration-upgrade, restart, and isolation.

## Phase 3 — Deterministic authority and permissions

Proposed packet; register after Phase 2.

- Extend the domain kernel with subject/action/resource authorization decisions and denial reasons.
- Bind the seven user action intents to versioned command/query intents without replacing the
  existing lifecycle verbs.
- Enforce organization, domain, project, classification, and temporal scopes.
- Keep the unavailable Constitution explicit; use only checked-in cited sources.

Predicate: authorization matrix, cross-domain access, separation-of-duty, and authority-hold tests.

## Phase 4 — Entity resolution and relationship traversal

Proposed packet; register after Phase 3.

- Implement normalization, aliases, trusted external identifiers, candidate scoring, and review
  decisions.
- Allow deterministic low-impact links only under versioned policy.
- Preserve relationship and source history across reversible merges.
- Add bounded temporal traversal across all five domains.

Predicate: duplicate prevention, ambiguous-merge refusal, reversible merge, relationship
preservation, and cross-domain traversal tests.

## Phase 5 — Unified search and retrieval

Proposed packet; register after Phase 4.

- Add structured repositories, SQLite FTS5, and bounded graph traversal behind one retrieval port.
- Apply permission scope before candidate selection and before response assembly.
- Return evidence envelopes with claims, passages, sources, and retrieval method.
- Evaluate lexical retrieval before authorizing embeddings.

Predicate: relevance fixtures, citation completeness, deterministic ranking, depth limits, and
restricted-data non-disclosure tests.

## Phase 6 — Internal intelligence interface and API

Proposed packets for services/api and apps/os; register after Phase 5 with distinct owners.

- Implement authenticated command/query boundaries with synthetic identities first.
- Present the seven action intents as the ordinary front door.
- Add progressive workspaces for Ask Victoroff, Search, People, Organizations, Relationships,
  Documents, Programmes, Projects, Calendar, Tasks, and domain lenses.
- Support answer -> claim -> source -> underlying record inspection.
- Wrap the internal router once with WhaleTransitionProvider. It centrally owns navigation
  qualification, concurrent preload, controlled variants, masked route commitment, loading hold,
  reveal, native history, route announcements, focus restoration, and reduced motion.
- Keep same-page anchors and local interactions immediate. No page may implement, override, or
  duplicate navigation-transition behavior.

Predicate: exact-revision command tests, server authorization tests, evidence-navigation end-to-end
tests, loading/empty/error states, accessibility, no primary-navigation governance leakage, and the
ADR 0004 transition verification contract. Register the transition engine as a single-owner packet
only after the internal router boundary exists; do not collide with active packages/ui owners.

## Phase 7 — Evidence-backed AI

Proposed packet; register after Phase 6 and API-key authorization.

- Define a provider-neutral model adapter and evidence-envelope response contract.
- Retrieve before factual answers; cite claims and records; distinguish facts, inference,
  contradiction, and unknowns.
- Prevent model output from directly changing verified records, authority, permissions, entity
  merges, approvals, or releases.
- Add prompt-injection and restricted-context tests.

Predicate: grounding, citation, contradiction, refusal, permission isolation, and no-authoritative-
write tests. No external model is required for deterministic contract tests.

## Phase 8 — Approved ingestion sources

Proposed packet; register after Phase 7.

- Implement connector contracts and a synthetic/file connector first.
- Add source discovery, acquisition, custody reference, extraction, normalization, proposal,
  review, indexing, replay, and reprocessing states.
- Add source terms, access, privacy, rights, and robots decision records.
- Introduce public web sources one connector at a time only after approval.

Predicate: idempotency, checksum, replay, processor-version, broken-source, contradiction, and review
queue tests.

## Phase 9 — Calendar, email, change detection, and automation

Proposed packets with separate connector owners.

- Add adapter contracts and synthetic adapters before credentials.
- Normalize meetings, events, tasks, deadlines, documents, and follow-ups into the common model.
- Add scheduled source refresh, material change detection, stale-source queues, data-quality checks,
  and broken-source alerts.
- Require explicit credentials and authorization before any live connector.

Predicate: least-privilege connector tests, replay safety, change-detection fixtures, restricted-data
isolation, and revocation behavior.

## Phase 10 — Production readiness

Authority-held. Do not dispatch while issues #2 and #3 or the authority-ratified gate remain open.

- Authorized identity and organization custody.
- Secrets, key rotation, rate limits, observability, privacy review, retention, export, deletion,
  backup, restore, disaster recovery, incident response, dependency scanning, and performance.
- Production-equivalent staging, accessibility, threat-model review, rollback, and exact-revision
  release receipts.

Predicate: a separately ratified release packet. Repository verification alone cannot release this
phase.

## Working discipline

- One writer owns each module and packet.
- Only an integration packet touches root configuration, lockfiles, shared navigation, or
  cross-module indexes.
- Each packet starts from exact remote main in an isolated worktree.
- pnpm verify:scoped is the local pre-push gate; exact-head CI is the durable runtime receipt.
- No task dispatch, production action, or authority claim is inferred from this plan.
