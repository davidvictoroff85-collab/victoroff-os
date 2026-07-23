# Victoroff.ai target architecture

Status: proposed subordinate architecture

Victoroff.ai is one institutional intelligence and operating system with five initial domain lenses:
BBNC Intelligence, Pedro Bay Intelligence, Regional Corporation Intelligence, Village Corporation
Intelligence, and Foundation / Nonprofit Intelligence. A domain is not a database boundary. The same
canonical entity may participate in several domains without duplication.

## Invariants

1. Complex governance stays underneath; simple actions stay on top.
2. The ordinary internal experience begins with exactly Start, Decide, Build, Release, Find a Rule,
   See What's Happening, and Understand Victoroff.
3. Source -> Extracted Information -> Claim -> Entity or Relationship -> Analysis remains
   inspectable. AI analysis never replaces source evidence.
4. Relationships are first-class, typed, temporal, sourced records.
5. Contradictory claims coexist until a deterministic or authorized review resolves their status.
6. Server-side authorization constrains every command, query, traversal, snippet, citation, cache,
   and AI context.
7. AI may retrieve, classify, suggest, compare, and explain. It may not approve, release, merge an
   ambiguous entity, invent authority, or write verified institutional truth.
8. Public, synthetic, internal, restricted, and future regulated information remain explicit
   classifications. The current mode permits public/synthetic data only.
9. Every meaningful internal route movement passes through one Global Whale Transition System;
   individual pages cannot implement, override, or duplicate page-transition behavior.

## Logical layers

### Experience

- apps/site remains the static, public-safe action center and product explanation.
- apps/os becomes the authenticated internal action workspace only after its packet and identity
  boundary are authorized.
- Primary navigation stays action-first. People, Organizations, Relationships, Documents,
  Programmes, Projects, Calendar, Tasks, Search, and intelligence domains are progressive-disclosure
  workspaces, not competing home screens.
- Governance -> Constitution exposes the complete inspectable authority chain when an authorized
  governing source exists.

### Global navigation transition

WhaleTransitionProvider wraps the internal application router once. It owns qualification,
preloading, transition state, centrally selected variants, route commitment, destination reveal,
history behavior, focus restoration, route announcements, and reduced-motion behavior. The six
controlled variants are standard, left-to-right, right-to-left, distant, close, and tail descent.

Normal motion targets 800–900 milliseconds within a hard 700–1000 millisecond envelope. Destination
loading begins immediately beneath the overlay. A slow destination holds on still, settled water
without looping the whale. Reduced motion uses the same route lifecycle with a 150–250 millisecond
water-line and opacity treatment.

The system qualifies same-origin page-to-page route changes, including back and forward movements
without adding history entries. It excludes external navigation, same-page anchors, modified clicks,
downloads, new-window targets, typing, dropdowns, accordions, modals, controls, filters, and minor
local state changes. The overlay is accessibility-hidden, never traps focus, and restores focus to
the destination landmark before announcing the new route. Assets are opportunistically preloaded;
route loading never blocks on animation downloads. ADR 0004 defines the executable contract.

### Command and query boundary

services/api will expose separate command and query handlers behind authenticated server-side
authorization.

Commands require identity, effective authority where applicable, exact revision, idempotency,
classification permission, lifecycle validity, and audit context. Queries receive a permission
scope before touching repositories and return an evidence envelope rather than unrestricted rows.

### Canonical institutional model

The initial versioned model contains:

- Entity: one canonical record for a person, organization, programme, project, contract, grant,
  funding record, investment, land interest, asset, location, document, meeting, decision, event, or
  historical record.
- EntityAlias: name, former name, abbreviation, external identifier, validity interval, source, and
  resolution state.
- DomainMembership: an entity's membership or relevance to one or more intelligence domains.
- Relationship: subject, predicate, object, validity interval, direction, status, confidence, and
  relationship type. It never embeds an uncited governing fact.
- Source: origin, source type, stable locator, rights/access classification, discovery metadata, and
  owning connector.
- SourceSnapshot: immutable acquisition event, checksum, publication or creation date, retrieval
  date, raw custody locator, extraction status, and supersession link.
- ExtractedRecord: normalized passage or field with source location, extraction method, extractor
  version, and confidence.
- Claim: a precise assertion with subject or relationship target, value, time scope, verification
  state, confidence, and last checked date.
- ClaimSupport: supports, contradicts, or qualifies a claim through one extracted record.
- Analysis: human or AI synthesis that cites claims and records its method, model or actor, prompt
  hash when applicable, and permission scope.
- PermissionGrant: subject, organization, domain, project, classification, action, validity, and
  source of authority.
- ReviewDecision: append-only verification, entity-match, merge, publication, or rejection outcome.
- AuditEvent: actor, action, affected object, prior revision, new revision, reason, workflow,
  authority, source, AI involvement, and timestamp.

All durable records use stable opaque identifiers, created and updated timestamps, revision numbers,
classification, and organization scope. Display names are never identifiers.

## Provenance and contradiction model

A source may have many immutable snapshots. A snapshot may yield many extracted records. An
extracted record may support, contradict, or qualify multiple claims. A claim may describe an entity
attribute or a relationship. Analysis cites claim identifiers and supporting record identifiers.

Verification state is separate from confidence. A high-confidence extraction is not automatically a
verified fact. Conflicting claims remain queryable with their sources, dates, scopes, and review
history. Supersession does not delete historical evidence.

## Entity resolution

Resolution proceeds through normalized identifiers, exact aliases, trusted external identifiers,
and then scored candidates. A suggestion records features and rationale but does not mutate the
canonical entity. Automatic linking is allowed only for deterministic, unique, low-impact matches
defined by a versioned policy. Ambiguous or high-impact merges enter review.

A merge decision preserves source records, redirects aliases, rewrites no historical event, and is
reversible through an audited compensating decision.

## Persistence

The first reference implementation uses local SQLite with foreign keys, transactions, recursive
common table expressions, JSON for bounded source-specific payloads, and FTS5 for lexical search.
Schema migrations are ordered, transactional where supported, restart-safe, and tested from an
empty database and the prior version.

Repository interfaces isolate domain code from SQLite and preserve a future PostgreSQL upgrade.
No graph database or vector service is introduced until measured query or scale limits justify it.

## Retrieval

One retrieval coordinator combines four bounded strategies:

1. Structured filtering for identifiers, types, dates, domains, classifications, and programme data.
2. Full-text retrieval over permitted document passages and names.
3. Relationship traversal over permitted entities and edges with depth and result limits.
4. Optional semantic retrieval behind an interface after an evaluated embedding packet exists.

Authorization produces the candidate scope before retrieval. Results are checked again before
assembly. Every result carries record identifiers, claim identifiers, citations, retrieval method,
and permission scope. Ranking never converts an analysis into verified evidence.

## Evidence-backed AI answers

The AI boundary receives a user question, authorized retrieval scope, bounded evidence envelope,
and response contract. It must retrieve before answering factual institutional questions, cite
supporting claims and source records, label inference, expose contradictions and uncertainty, and
return no answer when evidence or permission is insufficient.

Model output is stored only as Analysis or Suggestion. Promoting a claim, merging entities, changing
permissions, approving work, or releasing content remains a deterministic authorized command.

## Ingestion

Connectors implement discovery, acquisition, terms/access checks, and stable source identity. The
pipeline preserves the raw source or an authorized custody reference, extracts text or fields,
normalizes records, proposes entity matches and claims, validates confidence and quality, indexes
approved records, and routes required decisions to review.

Every stage is idempotent by source snapshot and processor version. Reprocessing creates a new
derived revision without erasing the prior result. Indiscriminate scraping is out of scope.

## Operational integrations

Calendar and email integrations use adapter ports and normalized Event, Meeting, Task, Deadline,
Document, and FollowUp records. Connectors receive the minimum scopes necessary, retain source
identifiers, and do not copy restricted content into broader domains. No live integration is created
without credentials and explicit authorization.

## Security and audit

- Default deny at API and repository boundaries.
- Permission checks include subject, action, resource, organization, domain, project,
  classification, and time.
- Restricted data never enters public bundles, logs, analytics, embeddings, or model context.
- Consequential commands produce append-only audit events and exact revisions.
- Secrets are injected at runtime and never committed.
- Export, backup, restore, deletion, retention, incident response, and model-provider review require
  later authorized specifications and executable receipts.

## Deployment boundary

This architecture does not authorize production infrastructure. The current implementation target
is a local synthetic vertical slice. Production identity, private data, external connectors,
deployment, DNS, repository custody, and commercial surfaces remain held by their existing gates.
