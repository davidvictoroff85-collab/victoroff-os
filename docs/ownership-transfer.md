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
- Preferred GitHub organization: not created as of 2026-07-21.
- Existing gates: organization transfer and member-admin issue #3, plus Vercel Git integration issue
  #2. The old paid-seat invitation path in issue #1 is closed as superseded.

## Acceptance predicate

1. The organization exists under the selected handle and its ownership settings are recorded.
2. The private repository transfer preserves default branch history, visibility, issues, and pull requests.
3. `admin@victoroffgroup.com` is invited through its GitHub account and receives Admin permission on
   `victoroff-os` without adding an unintended paid seat.
4. Local `origin`, issue URLs, and Vercel Git binding point to the transferred owner.
5. A commit-driven preview succeeds from the transferred private repository.
6. The exact verified preview revision is promoted to `victoroff-os.vercel.app`.
7. The pre-transfer production deployment remains documented and available for rollback.

Do not delete the old project, change DNS, or remove rollback custody as part of the transfer.
