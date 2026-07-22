export type LifecycleState = "draft" | "in_review" | "approved" | "released" | "withdrawn";
export type Command = "submit" | "request_changes" | "approve" | "release" | "withdraw";
export type Role = "author" | "reviewer" | "releaser" | "auditor";

export interface Initiative {
  id: string;
  revision: number;
  state: LifecycleState;
  authorId: string;
  approvedRevision: number | null;
  approvedBy: string | null;
  effectiveAuthorityId: string | null;
}

export interface CommandContext {
  actorId: string;
  roles: Role[];
  expectedRevision: number;
  authorityId: string | null;
  idempotencyKey: string;
}

export interface AuditEvent {
  eventId: string;
  initiativeId: string;
  command: Command;
  actorId: string;
  authorityId: string;
  from: LifecycleState;
  to: LifecycleState;
  exactRevision: number;
  occurredAt: string;
  idempotencyKey: string;
}

const transitions: Record<LifecycleState, Partial<Record<Command, LifecycleState>>> = {
  draft: { submit: "in_review" },
  in_review: { request_changes: "draft", approve: "approved" },
  approved: { request_changes: "draft", release: "released" },
  released: { withdraw: "withdrawn" },
  withdrawn: {},
};

const requiredRole: Record<Command, Role> = {
  submit: "author",
  request_changes: "reviewer",
  approve: "reviewer",
  release: "releaser",
  withdraw: "releaser",
};

export class DomainError extends Error {}

export function executeCommand(
  initiative: Initiative,
  command: Command,
  context: CommandContext,
  now = new Date(),
): { initiative: Initiative; event: AuditEvent } {
  if (!context.authorityId || context.authorityId !== initiative.effectiveAuthorityId) {
    throw new DomainError("effective authority is required");
  }
  if (context.expectedRevision !== initiative.revision) throw new DomainError("exact revision conflict");
  if (context.idempotencyKey.length < 16) throw new DomainError("idempotency key is too short");
  if (!context.roles.includes(requiredRole[command])) throw new DomainError("actor lacks required role");
  if ((command === "approve" || command === "release") && context.actorId === initiative.authorId) {
    throw new DomainError(`author cannot ${command} their own revision`);
  }
  if (command === "release" && initiative.approvedRevision !== initiative.revision) {
    throw new DomainError("release requires approval of the exact revision");
  }

  const nextState = transitions[initiative.state][command];
  if (!nextState) throw new DomainError(`invalid transition ${initiative.state}:${command}`);

  const next: Initiative = {
    ...initiative,
    state: nextState,
    approvedRevision: command === "approve" ? initiative.revision : initiative.approvedRevision,
    approvedBy: command === "approve" ? context.actorId : initiative.approvedBy,
  };
  if (command === "request_changes") {
    next.revision += 1;
    next.approvedRevision = null;
    next.approvedBy = null;
  }

  return {
    initiative: next,
    event: Object.freeze({
      eventId: `${initiative.id}:${context.idempotencyKey}`,
      initiativeId: initiative.id,
      command,
      actorId: context.actorId,
      authorityId: context.authorityId,
      from: initiative.state,
      to: nextState,
      exactRevision: initiative.revision,
      occurredAt: now.toISOString(),
      idempotencyKey: context.idempotencyKey,
    }),
  };
}

export class AuditLedger {
  readonly #events: readonly AuditEvent[];

  constructor(events: readonly AuditEvent[] = []) {
    this.#events = Object.freeze(events.map((event) => Object.freeze({ ...event })));
  }

  append(event: AuditEvent): AuditLedger {
    if (this.#events.some((item) => item.idempotencyKey === event.idempotencyKey)) {
      throw new DomainError("idempotency key was already used");
    }
    return new AuditLedger([...this.#events, Object.freeze({ ...event })]);
  }

  entries(): readonly AuditEvent[] {
    return this.#events;
  }
}
