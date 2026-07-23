# ADR 0002: SQLite-first hybrid retrieval

Status: proposed

Date: 2026-07-23

## Context

The target requires structured queries, full-text retrieval, relationship traversal, and an upgrade
path to semantic retrieval. The current repository has no durable data or measured workload. Adding
separate PostgreSQL, graph, vector, and queue systems now would multiply failure modes before their
benefit is demonstrated.

## Decision

Use local SQLite as the first reference store, with foreign keys, transactions, recursive common
table expressions, FTS5, and bounded JSON payloads. Hide persistence and retrieval behind repository
ports. Combine structured filters, lexical search, and bounded graph traversal in one permission-
aware coordinator.

Semantic retrieval remains an optional adapter. It may be added only after an evaluated packet
shows a material relevance gain and defines embedding custody, deletion, permissions, and rebuild
behavior. PostgreSQL or a graph store may replace an adapter only after measured limits justify it.

## Consequences

- The synthetic vertical slice has one local operational dependency.
- Migration, restart, backup, and isolation behavior can be tested deterministically.
- Query limits and recursive traversal depth must be explicit.
- SQLite-specific capabilities remain inside adapters so domain contracts do not depend on them.
- Production topology remains undecided and authority-held.
