import { describe, expect, it } from "vitest";
import { AuditLedger, DomainError, executeCommand, type Initiative } from "./index";

const draft = (): Initiative => ({
  id: "SYN-1",
  revision: 4,
  state: "draft",
  authorId: "author-a",
  approvedRevision: null,
  approvedBy: null,
  effectiveAuthorityId: "AUTH-1",
});

const context = (actorId: string, roles: Array<"author" | "reviewer" | "releaser" | "auditor">) => ({
  actorId,
  roles,
  expectedRevision: 4,
  authorityId: "AUTH-1",
  idempotencyKey: "0123456789abcdef",
});

describe("default-deny lifecycle", () => {
  it("requires effective authority", () => {
    expect(() => executeCommand(draft(), "submit", { ...context("author-a", ["author"]), authorityId: null })).toThrow(DomainError);
  });

  it("binds approval and release to the exact revision with separation of duty", () => {
    const submitted = executeCommand(draft(), "submit", context("author-a", ["author"])).initiative;
    expect(() => executeCommand(submitted, "approve", { ...context("author-a", ["reviewer"]), idempotencyKey: "1111111111111111" })).toThrow("author cannot approve");
    const approved = executeCommand(submitted, "approve", { ...context("reviewer-b", ["reviewer"]), idempotencyKey: "2222222222222222" }).initiative;
    const released = executeCommand(approved, "release", { ...context("releaser-c", ["releaser"]), idempotencyKey: "3333333333333333" });
    expect(released.initiative.state).toBe("released");
    expect(released.event.exactRevision).toBe(4);
  });

  it("invalidates approval when changes reopen work", () => {
    const approved: Initiative = { ...draft(), state: "approved", approvedRevision: 4, approvedBy: "reviewer-b" };
    const changed = executeCommand(approved, "request_changes", { ...context("reviewer-b", ["reviewer"]), idempotencyKey: "4444444444444444" }).initiative;
    expect(changed).toMatchObject({ state: "draft", revision: 5, approvedRevision: null });
  });

  it("keeps an immutable, idempotent audit ledger", () => {
    const result = executeCommand(draft(), "submit", context("author-a", ["author"]));
    const ledger = new AuditLedger().append(result.event);
    expect(Object.isFrozen(ledger.entries()[0])).toBe(true);
    expect(() => ledger.append(result.event)).toThrow("idempotency key");
  });
});
