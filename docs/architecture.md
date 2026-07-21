# Concentric architecture

The product is cumulative. A later ring extends an earlier working product; it does not replace it.

| Ring | Working product | Owner | Data boundary |
|---|---|---|---|
| Center | Find, prepare, complete, and get help | Shareholder | No guide-side storage |
| Guide | Anonymous deadlines, eligibility, preparation, sources, and handoffs | Public Communications | Allow-listed public information |
| Connect | Verified routes and health monitoring for owning systems | Integration owners | Route health, never shareholder payloads |
| Operate | Draft, review, exact-revision approval, evidence, release, outcomes | BBNC Stewardship | Internal authority and audit records |
| Rebuild | Complete BBNC.net experience powered by signed releases | BBNC product and communications | Verified public packages |
| Own | BBNC repositories, infrastructure, recovery, measurement, improvement | BBNC | BBNC-controlled institutional assets |

## Public boundary

`apps/site` imports only `@victoroff/contracts`, `@victoroff/fixtures`, and `@victoroff/ui`. The
policy gate rejects imports from `@victoroff/domain` and `@victoroff/publication`. Critical action
content and external handoffs are present in static HTML so the guide remains useful when JavaScript
is disabled.

## Internal command boundary

`packages/contracts/openapi.v1.yaml` defines `/api/v1` as an authenticated internal command
surface. Commands are default-deny and require effective authority, an exact expected revision, an
idempotency key, a valid lifecycle transition, and the required role. Approval and release are
separated from authorship.

## Publication boundary

Only signed `publication-package.v1` objects containing allow-listed public actions and assets may
cross into the public application. The consumer verifies schema, classification, source freshness,
signature, expiry, and monotonic revision before an atomic swap. Failures create quarantine receipts
and preserve the last-known-good revision. A signed `withdrawal-tombstone.v1` may withdraw only the
exact live revision it names.

## Production ownership

After an accepted Phase 0 authority workshop, production work moves to BBNC-controlled
`bbnc-stewardship` and `bbnc-web` repositories. This repository is a vendor-owned demonstration and
must not become an undeclared production authority.
