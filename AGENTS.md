# Victoroff OS Agent Protocol

Read this file before changing the repository. Victoroff OS is an uncommissioned,
public/synthetic product concept. It is not BBNC authority, production custody, or permission to
represent BBNC.

## Product rule

Complex governance stays underneath; simple actions stay on top.

- The internal OS begins with exactly seven action intents: Start, Decide, Build, Release, Find a
  Rule, See What's Happening, and Understand Victoroff.
- An ordinary user receives one valid next action without reading the Constitution first.
- The complete authority chain remains inspectable under Governance -> Constitution.
- Detailed delivery status, checkpoint arithmetic, and outcome evidence are secondary proof or
  governance surfaces. They do not belong in ordinary primary navigation.

## Authority boundary

Issues #2 and #3 are the live custody holds. Until their release predicates pass, do not create an
organization, transfer a repository, change collaborators, install a GitHub App, alter DNS, deploy
or promote a production surface, move infrastructure, create the commercial repository, use real
BBNC identities or records, or imply BBNC approval or representation.

The repository defaults to synthetic identities, local SQLite, public sources, and no public-side
storage. AI may classify or explain an intent, but only deterministic code may resolve governing
authority. AI cannot approve, release, invent authority, or present an uncited rule as governing
truth.

## Source of truth

`program/registry.v1.json` owns the additive program, the preserved 55-checkpoint BBNC graph, path
ownership, release gates, and bounded work packets. Run:

```bash
pnpm verify:control
```

before changing or dispatching a packet. Do not copy checkpoint totals into application code. A
surface that shows progress must derive it from a validated registry projection.

## Change discipline

- Work from the exact remote `main` SHA in one isolated worktree and one topic branch.
- Never push directly to `main`; use a pull request and preserve the exact-head check receipt.
- Re-read live open PRs and worktrees before selecting paths. A co-equal owner branch is evidence,
  not overwrite authority.
- Honor the packet's `allowed_paths`. Only the named integration packet may touch shared
  navigation, root configuration, lockfiles, or cross-module indexes.
- Every packet declares dependencies, one executable predicate, and one durable receipt target.
- Use `pnpm verify:scoped` as the local pre-push gate. Reuse a passing exact-head receipt unless the
  head changes or a specific failure appears.
- Do not edit `tasks.yaml` here. Fleet packets are created through Limen/TABVLARIVS.

## Jules campaign gate

Jules remains closed until the `control-main-green` gate in the registry resolves against live
remote `main`. After release, create packets through TABVLARIVS and launch only exact IDs:

```bash
limen dispatch --agent jules --task <TASK_ID> --live
```

Never use broad Jules dispatch and never set parallelism above one. One writer owns each module.
Dependencies require a merged, predicate-green remote receipt; a created PR or a prose `done` claim
does not release a dependent packet. Stop new launches on feedback requests, rate limits,
unauthorized paths, stale bases, failed ancestry, duplicate PRs, collisions, red admission state,
or three completed-but-unlanded results.

## Verification

CI is sharded and cancels superseded runs. The required `gate` job succeeds only when every
implicated shard succeeds or is intentionally skipped by the checked-in scope planner. No authority,
custody, DNS, deployment, or commercial-repository action is part of repository verification.
