# ADR 0003: AI evidence and authority boundary

Status: proposed

Date: 2026-07-23

## Context

Victoroff.ai must answer complicated institutional questions while preserving source evidence,
contradictions, permissions, and governing authority. Generated prose is probabilistic and cannot be
treated as a verified record or authorization decision.

## Decision

AI receives only a permission-filtered, bounded evidence envelope. Factual answers retrieve first,
cite claims and source records, label inference and uncertainty, expose contradictions, and refuse
when evidence or access is insufficient.

AI output may be stored only as Analysis or Suggestion with model-run provenance. Deterministic,
authorized commands exclusively control verified claims, entity merges, permissions, approvals,
releases, and governing-authority resolution. Retrieval permission is enforced before model context
assembly and response permission is enforced again before delivery.

## Consequences

- An AI provider can be replaced without changing institutional truth contracts.
- Grounding, citation, prompt-injection, and restricted-data tests are release requirements.
- Model logs, caches, embeddings, and traces are part of the data boundary.
- Answers may be incomplete or refuse when evidence is weak; the system must show why.
- No model credential or live provider is needed to test the deterministic boundary.
