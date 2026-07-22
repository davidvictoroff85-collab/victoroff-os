# Repository and hosting ownership transfer

The preferred durable owner is a free GitHub organization named `victoroffgroup`; use `victoroff-os`
only if the preferred handle is unavailable. Organization creation, repository transfer, and a member
invitation are account-level actions and must be completed by the account owner.

## Current state

- Repository: private `organvm/victoroff-os`.
- Viewer permission for the current operator: `ADMIN`.
- Production alias: `victoroff-os.vercel.app`.
- Rollback deployment: `dpl_9MT8gN1UWCjC9eq793F8izLi8aw5`.
- Vercel CLI ownership: account `4444j99`, team context `iviivi`.
- Canonical hosting target: `victoroffgroup.com` on Cloudflare Workers Static Assets.
- Vercel status: frozen, public-but-noindexed rollback custody; no further promotions in this lane.
- Preferred GitHub organization: not created as of 2026-07-21.
- Existing gates: organization transfer and member-admin issue #3, plus Cloudflare build and cutover
  issue #2. The old Vercel Git-integration and paid-seat invitation paths are superseded.

## Acceptance predicate

1. The organization exists under the selected handle and its ownership settings are recorded.
2. The private repository transfer preserves default branch history, visibility, issues, and pull requests.
3. `admin@victoroffgroup.com` is invited through its GitHub account and receives Admin permission on
   `victoroff-os` without adding an unintended paid seat.
4. Local `origin` and issue URLs point to the transferred owner; the frozen Vercel project remains
   unbound from Git and retains explicit owner-approved rollback custody.
5. A commit-linked Cloudflare preview succeeds from the transferred private repository.
6. The exact verified revision is deployed through Workers Builds and reaches the apex only after
   the rollback rehearsal, privacy, accessibility, and mail-DNS predicates in issue #2 pass.
7. The existing Vercel production and rollback deployments remain untouched and available for
   rollback custody.

Do not delete the old project, change DNS, or remove rollback custody as part of the transfer.
