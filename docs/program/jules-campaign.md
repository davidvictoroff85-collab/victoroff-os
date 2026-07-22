# Jules campaign contract

The campaign consumes only validated, ready work packets from `program/registry.v1.json`, created in
Limen through TABVLARIVS. It never sweeps the queue and never launches before
`control-main-green` passes against the exact remote `main` SHA.

## Launch and landing

Launch exactly one named packet per command:

```bash
limen dispatch --agent jules --task <TASK_ID> --live
```

The ordinary rolling ceiling is 96 unique numeric Jules session starts in 24 hours, preserving four
starts for legitimate recovery. Start no more than four sessions in a sliding hour and refill no
faster than one every 15 minutes. A packet's dependent is not ready until the prerequisite PR is
merged and its predicate is green on remote `main`.

Begin with WIP 3. WIP 5 requires three useful, green, non-conflicting canary PRs. WIP 8 requires ten
merged predicate-green receipts, at least 80 percent useful-PR yield, no more than 10 percent
failure/no-op rate, and zero path/base collision. Unused capacity stays unused when the DAG has no
legitimate leaf.

## Stop conditions

Stop new launches immediately on a feedback or approval request, rate limit, unauthorized path,
stale base, failed dependency ancestry, duplicate PR, CI/path collision, red admission/governor
state, or three completed-but-unlanded results. Existing work is preserved; no peer process is
killed or rewritten.

Every two hours, publish a bounded scorecard with launches, active work, failures, PRs, merged
predicates, collisions, landing backlog, and the true rolling quota counted by unique numeric session
ID. Dispatch-transition duplicates do not consume a second start.

## Packet body

Each TABVLARIVS packet carries its exact base SHA, phase/module, allowed and forbidden paths, merged
dependencies and receipt SHAs, testable behavior, synthetic/public authority boundary, one predicate,
and one durable PR/check receipt target. It instructs Jules to stop with a precise blocker instead of
requesting feedback or inventing authority.
