# Victoroff canary campaign continuation

## Objective

Resume from live remote truth after the control-plane PR merges. Resolve `control-main-green`; if it
passes, create the three exact canary packets through TABVLARIVS and launch only the ready,
non-colliding leaves under the checked-in Jules campaign limits. Continue landing verified packets
without crossing the authority holds.

## Current evidence

- Repository: `organvm/victoroff-os` (private).
- Control repair: PR #14, branch `codex/vic-control-ci-001-20260722`.
- Registry: `program/registry.v1.json`.
- PR #11 reconciliation: `program/reconciliations/pr-11.v1.json`.
- Tier progression: `program/product/economic-agency-tiers.v1.json`.
- Embedded-finance reservation: `program/product/embedded-finance-reservation.v1.json`.
- Authority/custody holds: issues #2 and #3.
- Required control predicate: `node scripts/control/check-live-control-gate.mjs`.
- Limen rail repair: `organvm/limen` PR #1364.
- Deployed Conduct schema owner: `organvm/limen` issue #1365.
- Live-root/governor recovery owner: `organvm/limen` issue #1366.
- Installed heartbeat cartridge owner: `organvm/domus-genoma` issue #320.

Derive the current remote main SHA, exact check receipts, open PRs, active worktrees, Limen board,
Jules usage telemetry, host admission, and packet dependencies again at launch. Do not reuse the SHAs
or run counts in this README as current truth.

## Authorities and prohibitions

Reversible public/synthetic repository work may proceed without confirmation inside each packet's
allowed paths. Do not create organizations or repositories, transfer custody, change access, install
apps, alter DNS or deployments, use real BBNC identities/data, spend money, send public
representations, or modify host/runtime policy.

Do not edit `tasks.yaml` by hand. Create packets through TABVLARIVS, dispatch only exact task IDs,
never use broad Jules dispatch, and never use parallelism above one. PR #11 remains owned by 4444J99;
do not rewrite or force-push its branch.

## First probes

```bash
git ls-remote origin refs/heads/main refs/pull/11/head
gh pr list --repo organvm/victoroff-os --state open
git worktree list --porcelain
pnpm verify:control
node scripts/control/check-live-control-gate.mjs
python3 /Users/4jp/Workspace/limen/scripts/host-work-admission.py status
python3 /Users/4jp/Workspace/limen/scripts/autonomy-governor.py dispatch-ok
```

Create and launch `VIC-GOV-001`, `VIC-CONTRACT-001`, and `VIC-DOMAIN-001` using the exact registry
contracts only after the Victoroff control repair and Limen rail repair are merged, the Conduct
schema accepts the current WorkLoan packet, host admission reports `allowed: true`, and
`dispatch-ok` exits zero without `LIMEN_FORCE_AUTONOMY`. Re-check true rolling Jules usage by unique
numeric session ID before each launch.

`VIC-TIER-001` remains dependent on the merged domain canary. `VIC-FINANCE-001` remains dependent on
the tier packet and may produce only provider-neutral architecture and risk evidence. Neither packet
authorizes an account, card, payment, credit, money movement, vendor commitment, or financial claim.

## Completion and switching

A packet closes only when its PR is merged, its predicate passes on the exact remote-main revision,
and the receipt is durable. Switch sessions before the finite runway expires, when the registry or
remote base changes materially, or when a real authority/resource gate prevents further safe work.
Before switching, emit a successor capsule and copy/paste launch command; never predeclare that the
campaign or Omega is reachable.

## Launch

```bash
git -C /Users/4jp/Workspace/victoroff-os fetch origin && limen workstream /Users/4jp/Workspace/victoroff-os victoroff-canary-campaign-20260722 --from origin/main --runway 7d --agent auto --autonomous --prompt "Read docs/continuations/victoroff-canary-campaign-20260722/README.md completely, then derive live truth and continue the bounded Victoroff canary campaign."
```
