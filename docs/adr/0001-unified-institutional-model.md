# ADR 0001: Unified canonical institutional model

Status: proposed

Date: 2026-07-23

## Context

The five intelligence domains overlap. The same organization, person, programme, document, asset,
or relationship may be relevant to several domains. Separate domain databases would duplicate
identity, fragment provenance, and make cross-domain questions unreliable.

## Decision

Use one versioned canonical model for entities, aliases, domain memberships, relationships, sources,
snapshots, extracted records, claims, claim support, analyses, permissions, reviews, and audit events.
Intelligence domains are memberships and query lenses over this shared model, not storage silos.

Relationships are durable first-class records. Claims support entity attributes or relationships and
retain supporting, contradicting, and qualifying evidence. Verification state remains separate from
confidence. Display names never serve as identifiers.

## Consequences

- Cross-domain traversal does not require duplicate entities or data synchronization.
- Ingestion and entity resolution must preserve source-specific records before linking canonically.
- Permission checks must apply to both entities and edges.
- Domain-specific fields use versioned extensions or bounded payloads rather than competing core
  tables.
- Contract evolution requires migrations and compatibility tests.

## Authority boundary

This ADR defines proposed software structure only. It does not establish institutional facts,
constitutional rules, BBNC authority, or permission to ingest real identities or records.
