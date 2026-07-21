# Victoroff OS

> Every shareholder task. One clear next step.

Victoroff OS is a private, uncommissioned product concept for a public-safe shareholder action
center and a governed institutional publication system. It does not assert BBNC authority,
affiliation, commission, production status, or permission to represent BBNC publicly.

**Live rollback:** <https://victoroff-os.vercel.app>

## Workspace

| Surface | Purpose | Public deployment |
|---|---|---|
| `apps/site` | Anonymous Shareholder Action Center and product pitch | Yes |
| `apps/stewardship-demo` | Synthetic staff workflow proof | No |
| `packages/contracts` | OpenAPI 3.1 and JSON Schema contracts | Build artifact |
| `packages/domain` | Authority, lifecycle, approval, release, and audit rules | Internal only |
| `packages/publication` | Signing, verification, quarantine, receipts, and withdrawal | Internal only |
| `packages/fixtures` | Verified public sources and synthetic demonstration records | Public subset only |
| `packages/ui` | Shared accessible black-and-white primitives | Both apps |

The public site can import contracts, public fixtures, and UI only. It cannot import internal
domain or publication code. `vercel.json` stages only `apps/site` into the deployable output.

## Run

```bash
pnpm install
pnpm dev
```

The separate staff demonstration runs with:

```bash
pnpm --filter @victoroff/stewardship-demo dev
```

## Verify

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:a11y
pnpm test:e2e
pnpm build
```

`pnpm lint` is a release-policy gate. It rejects non-black/white CSS colors, gradients, shadows,
external fonts, missing concept/noindex controls, expired source records, broken static handoffs,
unclassified action content, and forbidden public-to-internal dependencies.

## Safety boundary

The concept stores no credentials, PII, uploads, applications, submissions, votes, cookies, local
storage, analytics identifiers, or form data. myBBNC remains the authenticated shareholder record
system. BBNCVote remains the voting system. Every external handoff is labeled and retains a human
fallback.

See [architecture](docs/architecture.md), [phase delivery](docs/phase-plan.md), and
[ownership transfer](docs/ownership-transfer.md).

## Existing remote receipts

- Initial live source: `799ca7f` on `organvm/victoroff-os` `main`.
- Rollback deployment: `dpl_9MT8gN1UWCjC9eq793F8izLi8aw5` (`READY`).
- Organization transfer and member-admin gate: [issue #3](https://github.com/organvm/victoroff-os/issues/3).
- Private-repo Vercel Git integration gate: [issue #2](https://github.com/organvm/victoroff-os/issues/2).
