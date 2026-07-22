import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { PublicationPackageUnsigned, WithdrawalTombstoneUnsigned } from "@victoroff/contracts";
import { PublicationConsumer, signPackage, signTombstone } from "./index";

const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const { privateKey: wrongPrivateKey } = generateKeyPairSync("ed25519");
const now = new Date("2026-07-21T12:00:00Z");

function unsigned(revision = 1): PublicationPackageUnsigned {
  return {
    schemaVersion: "publication-package.v1",
    packageId: "public-actions",
    revision,
    publishedAt: "2026-07-21T11:00:00Z",
    expiresAt: "2026-11-01T00:00:00Z",
    classification: "public",
    content: {
      actions: [
        {
          schemaVersion: "shareholder-action.v1",
          id: "synthetic-action",
          title: "Synthetic action",
          shortLabel: "Synthetic",
          audience: "Synthetic test users",
          rule: "Use only the public source.",
          deadline: "No deadline.",
          preparation: ["Prepare one public item."],
          ownerSystem: "Synthetic owner",
          handoff: { label: "Open owner", url: "https://example.com", external: true },
          fallback: "Call the synthetic owner.",
          source: { owner: "Synthetic source", url: "https://example.com/source" },
          reviewedAt: "2026-07-21",
          expiresAt: "2026-10-01",
          classification: "public",
        },
      ],
    },
    assets: [],
  };
}

function tombstone(overrides: Partial<WithdrawalTombstoneUnsigned> = {}): WithdrawalTombstoneUnsigned {
  return {
    schemaVersion: "withdrawal-tombstone.v1",
    tombstoneId: "withdraw-1",
    targetPackageId: "public-actions",
    targetRevision: 1,
    reasonCode: "source-withdrawn",
    issuedAt: now.toISOString(),
    ...overrides,
  };
}

describe("publication boundary", () => {
  it("accepts one valid signed package atomically", () => {
    const consumer = new PublicationConsumer();
    expect(consumer.ingest(signPackage(unsigned(), privateKey), publicKey, now).status).toBe("accepted");
    expect(consumer.current()?.revision).toBe(1);
  });

  it("quarantines invalid signatures and retains last-known-good", () => {
    const consumer = new PublicationConsumer();
    consumer.ingest(signPackage(unsigned(), privateKey), publicKey, now);
    const result = consumer.ingest(signPackage(unsigned(2), wrongPrivateKey), publicKey, now);
    expect(result).toMatchObject({ status: "quarantined", retainedRevision: 1 });
    expect(consumer.current()?.revision).toBe(1);
  });

  it("rejects replay", () => {
    const consumer = new PublicationConsumer();
    const signed = signPackage(unsigned(), privateKey);
    consumer.ingest(signed, publicKey, now);
    expect(consumer.ingest(signed, publicKey, now).reason).toContain("replay");
  });

  it("rejects expired packages", () => {
    const consumer = new PublicationConsumer();
    const expired = signPackage({ ...unsigned(), expiresAt: "2026-07-20T00:00:00Z" }, privateKey);
    expect(consumer.ingest(expired, publicKey, now).reason).toContain("expired");
    const malformed = signPackage({ ...unsigned(2), expiresAt: "not-a-date" }, privateKey);
    expect(consumer.ingest(malformed, publicKey, now).reason).toContain("timestamp");
    for (const [index, expiresAt] of ["2026-02-30T00:00:00Z", "2026-07-21T12:30:00", "2026-07-21T12:30:00+24:00"].entries()) {
      const invalid = signPackage({ ...unsigned(index + 3), expiresAt }, privateKey);
      expect(consumer.ingest(invalid, publicKey, now).reason).toContain("timestamp");
    }
  });

  it("rejects schema mismatch and non-allow-listed fields", () => {
    const consumer = new PublicationConsumer();
    const mismatch = { ...signPackage(unsigned(), privateKey), schemaVersion: "publication-package.v2" };
    expect(consumer.ingest(mismatch as never, publicKey, now).status).toBe("quarantined");
    const extra = { ...signPackage(unsigned(), privateKey), internalNotes: "never public" };
    expect(consumer.ingest(extra as never, publicKey, now).reason).toContain("allow-listed");

    const extraAction = unsigned(2) as PublicationPackageUnsigned & {
      content: { actions: Array<PublicationPackageUnsigned["content"]["actions"][number] & { internalNotes?: string }> };
    };
    extraAction.content.actions[0]!.internalNotes = "never public";
    expect(consumer.ingest(signPackage(extraAction, privateKey), publicKey, now).reason).toContain("action schema");

    const unsafeHandoff = unsigned(3);
    unsafeHandoff.content.actions[0]!.handoff.url = "http://example.com";
    expect(consumer.ingest(signPackage(unsafeHandoff, privateKey), publicKey, now).reason).toContain("action schema");

    for (const [index, url] of ["https:example.com", "HTTPS://example.com", " https://example.com"].entries()) {
      const invalidUrl = unsigned(index + 4);
      invalidUrl.content.actions[0]!.handoff.url = url;
      expect(consumer.ingest(signPackage(invalidUrl, privateKey), publicKey, now).reason).toContain("action schema");
    }
  });

  it("rejects unsafe asset paths", () => {
    const consumer = new PublicationConsumer();
    for (const [index, path] of ["", "../private.json", "/absolute.css"].entries()) {
      const value = unsigned(index + 1);
      value.assets.push({ path, sha256: "a".repeat(64), classification: "public" });
      expect(consumer.ingest(signPackage(value, privateKey), publicKey, now).reason).toContain("asset path");
    }
  });

  it("detects corruption", () => {
    const consumer = new PublicationConsumer();
    const signed = signPackage(unsigned(), privateKey);
    signed.content.actions[0]!.title = "Tampered";
    expect(consumer.ingest(signed, publicKey, now).reason).toContain("corrupted");
    expect(consumer.ingest("{not-json", publicKey, now).reason).toContain("corrupt JSON");
  });

  it("retains last-known-good during feed outage", () => {
    const consumer = new PublicationConsumer();
    consumer.ingest(signPackage(unsigned(), privateKey), publicKey, now);
    expect(consumer.recordFeedOutage(now)).toMatchObject({ status: "quarantined", retainedRevision: 1 });
    expect(consumer.current()?.revision).toBe(1);
  });

  it("exposes only immutable publication and receipt snapshots", () => {
    const consumer = new PublicationConsumer();
    consumer.ingest(signPackage(unsigned(), privateKey), publicKey, now);
    const current = consumer.current();
    expect(Object.isFrozen(current)).toBe(true);
    expect(Object.isFrozen(current?.content.actions)).toBe(true);
    expect(Object.isFrozen(consumer.receipts)).toBe(true);
    expect(Object.isFrozen(consumer.receipts[0])).toBe(true);
    expect(() => (current?.content.actions as unknown as unknown[]).push({})).toThrow();
    expect(() => (consumer.receipts as unknown as unknown[]).push({})).toThrow();
    expect(consumer.current()?.content.actions).toHaveLength(1);
    expect(consumer.receipts).toHaveLength(1);
  });

  it("withdraws only the exact live revision with a signed tombstone", () => {
    const consumer = new PublicationConsumer();
    consumer.ingest(signPackage(unsigned(), privateKey), publicKey, now);
    expect(consumer.withdraw(signTombstone(tombstone(), privateKey), publicKey, now).status).toBe("withdrawn");
    expect(consumer.current()).toBeNull();
  });

  it("refuses arbitrary or wrongly signed withdrawal", () => {
    const consumer = new PublicationConsumer();
    consumer.ingest(signPackage(unsigned(), privateKey), publicKey, now);
    const wrongTarget: WithdrawalTombstoneUnsigned = {
      schemaVersion: "withdrawal-tombstone.v1",
      tombstoneId: "withdraw-2",
      targetPackageId: "another-package",
      targetRevision: 1,
      reasonCode: "safety-correction",
      issuedAt: now.toISOString(),
    };
    expect(consumer.withdraw(signTombstone(wrongTarget, privateKey), publicKey, now).status).toBe("quarantined");
    expect(consumer.current()?.packageId).toBe("public-actions");
  });

  it("rejects tombstones outside the signed allow-list", () => {
    const consumer = new PublicationConsumer();
    consumer.ingest(signPackage(unsigned(), privateKey), publicKey, now);
    const malformedReason = signTombstone({ ...tombstone(), reasonCode: "arbitrary" } as never, privateKey);
    expect(consumer.withdraw(malformedReason as never, publicKey, now).reason).toContain("reason");
    const malformedDate = signTombstone({ ...tombstone({ tombstoneId: "withdraw-2" }), issuedAt: "not-a-date" }, privateKey);
    expect(consumer.withdraw(malformedDate, publicKey, now).reason).toContain("issuance");
    const extraField = { ...signTombstone(tombstone({ tombstoneId: "withdraw-3" }), privateKey), deleteAnything: true };
    expect(consumer.withdraw(extraField as never, publicKey, now).reason).toContain("allow-listed");
    expect(consumer.current()?.packageId).toBe("public-actions");
  });
});
