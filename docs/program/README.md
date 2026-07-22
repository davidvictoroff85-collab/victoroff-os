# Victoroff program control plane

Victoroff is an additive program with three separately governed tracks:

1. **Victoroff OS** is the internal-first operating system. Its seven entrances are Start, Decide,
   Build, Release, Find a Rule, See What's Happening, and Understand Victoroff.
2. **Shareholder Development Solution** is the reusable integration product. The existing public
   BBNC Action Center remains a synthetic, uncommissioned adoption exemplar.
3. **Victoroff Commercial** is a future private business and adoption repository. It does not exist
   until the ratified principal and product/IP split authorize its namespace and custody.

The machine source of truth is [`program/registry.v1.json`](../../program/registry.v1.json). It
contains path ownership, gates, the 55-checkpoint legacy BBNC subgraph, the PR #11 reconciliation
packet, and the first three bounded Jules canaries. The 12/55 values imported from PR #11 are
provisional claims; they earn no completion credit until each checkpoint has its own passing
predicate and exact-revision receipt.

## Surface map

| Surface | Role | Current boundary |
|---|---|---|
| `apps/site` | Static product explanation, Governance, Proof, and adoption material | Public-safe, synthetic, no storage |
| `apps/os` | Authenticated internal action workspace | Planned; synthetic identities before authority |
| `apps/shareholder-demo` | Extracted six-journey shareholder Action Center | Planned extraction from the existing public proof |
| `apps/stewardship-demo` | Existing synthetic staff workflow proof | Preserved during migration |
| `services/api` | Fastify command/query API | Planned |
| `packages/governance` | Authority graph and deterministic resolution | Planned |
| `packages/domain` | Lifecycle, exact-revision commands, separation of duties, audit | Existing kernel; expands by packet |
| `packages/persistence` | Repository ports, SQLite reference, gated PostgreSQL adapter | Planned |
| `packages/publication` | Signed packages, quarantine, replay protection, withdrawal, receipts | Existing kernel |
| `packages/shareholder-development` | Reusable content, route, handoff, and outcome contracts | Planned |

## Release order

The immediate control tranche must merge and pass on exact remote `main` before any Jules launch.
After that gate, only ready DAG leaves may run. The first leaves are `VIC-GOV-001`,
`VIC-CONTRACT-001`, and `VIC-DOMAIN-001`; their paths do not overlap. PR #11 remains owner-held and
is integrated only through `VIC-PR11-INTEGRATE` after the same control gate.

Issues #2 and #3 remain the durable authority and custody blockers. No repository transfer,
commercial repository creation, DNS change, deployment promotion, real client data, or BBNC
representation is part of this program control tranche.
