import { randomUUID, sign, verify, type KeyObject } from "node:crypto";
import type {
  PublicationPackageUnsigned,
  PublicationPackageV1,
  PublicationReceiptV1,
  ShareholderActionV1,
  WithdrawalTombstoneUnsigned,
  WithdrawalTombstoneV1,
} from "@victoroff/contracts";

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(",")}}`;
}

function unsignedPackage(value: PublicationPackageV1): PublicationPackageUnsigned {
  const { signature: _signature, ...unsigned } = value;
  return unsigned;
}

function unsignedTombstone(value: WithdrawalTombstoneV1): WithdrawalTombstoneUnsigned {
  const { signature: _signature, ...unsigned } = value;
  return unsigned;
}

export function signPackage(value: PublicationPackageUnsigned, privateKey: KeyObject): PublicationPackageV1 {
  return {
    ...value,
    signature: sign(null, Buffer.from(canonicalize(value)), privateKey).toString("base64"),
  };
}

export function signTombstone(value: WithdrawalTombstoneUnsigned, privateKey: KeyObject): WithdrawalTombstoneV1 {
  return {
    ...value,
    signature: sign(null, Buffer.from(canonicalize(value)), privateKey).toString("base64"),
  };
}

function verifyPackage(value: PublicationPackageV1, publicKey: KeyObject): boolean {
  return verify(null, Buffer.from(canonicalize(unsignedPackage(value))), publicKey, Buffer.from(value.signature, "base64"));
}

function verifyTombstone(value: WithdrawalTombstoneV1, publicKey: KeyObject): boolean {
  return verify(null, Buffer.from(canonicalize(unsignedTombstone(value))), publicKey, Buffer.from(value.signature, "base64"));
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).sort().join("|") === [...keys].sort().join("|");
}

function validAction(action: unknown, now: Date): action is ShareholderActionV1 {
  if (!action || typeof action !== "object") return false;
  const value = action as Record<string, unknown>;
  return (
    value.schemaVersion === "shareholder-action.v1" &&
    value.classification === "public" &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.rule === "string" &&
    Array.isArray(value.preparation) &&
    typeof value.expiresAt === "string" &&
    new Date(`${value.expiresAt}T23:59:59Z`) >= now
  );
}

function packageShapeError(value: unknown, now: Date): string | null {
  if (!value || typeof value !== "object") return "package is not an object";
  const packageValue = value as Record<string, unknown>;
  const keys = ["schemaVersion", "packageId", "revision", "publishedAt", "expiresAt", "classification", "content", "assets", "signature"];
  if (!exactKeys(packageValue, keys)) return "package contains missing or non-allow-listed fields";
  if (packageValue.schemaVersion !== "publication-package.v1") return "schema mismatch";
  if (packageValue.classification !== "public") return "package is not public";
  if (typeof packageValue.packageId !== "string" || !Number.isInteger(packageValue.revision) || Number(packageValue.revision) < 1) {
    return "package identity is invalid";
  }
  if (typeof packageValue.signature !== "string" || typeof packageValue.expiresAt !== "string") return "signature or expiry is invalid";
  if (new Date(packageValue.expiresAt) <= now) return "package expired";
  const content = packageValue.content as Record<string, unknown> | undefined;
  if (!content || !exactKeys(content, ["actions"]) || !Array.isArray(content.actions)) return "content allow-list failed";
  if (!content.actions.every((action) => validAction(action, now))) return "action schema or source expiry failed";
  if (!Array.isArray(packageValue.assets)) return "assets are invalid";
  for (const asset of packageValue.assets) {
    if (!asset || typeof asset !== "object") return "asset is invalid";
    const candidate = asset as Record<string, unknown>;
    if (!exactKeys(candidate, ["path", "sha256", "classification"])) return "asset allow-list failed";
    if (candidate.classification !== "public" || typeof candidate.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(candidate.sha256)) {
      return "asset hash or classification failed";
    }
  }
  return null;
}

function receipt(
  status: PublicationReceiptV1["status"],
  packageId: string,
  revision: number,
  receivedAt: Date,
  retainedRevision: number | null,
  reason?: string,
): PublicationReceiptV1 {
  return {
    schemaVersion: "publication-receipt.v1",
    receiptId: randomUUID(),
    packageId,
    revision,
    status,
    ...(reason ? { reason } : {}),
    receivedAt: receivedAt.toISOString(),
    retainedRevision,
  };
}

export class PublicationConsumer {
  #current: PublicationPackageV1 | null = null;
  readonly #maxRevision = new Map<string, number>();
  readonly #tombstones = new Set<string>();
  readonly receipts: PublicationReceiptV1[] = [];

  current(): PublicationPackageV1 | null {
    return this.#current;
  }

  ingest(serialized: string | PublicationPackageV1, publicKey: KeyObject, now = new Date()): PublicationReceiptV1 {
    let candidate: unknown;
    try {
      candidate = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
    } catch {
      return this.#quarantine("unknown", 1, "corrupt JSON", now);
    }

    const error = packageShapeError(candidate, now);
    const packageId = typeof (candidate as Record<string, unknown>)?.packageId === "string" ? String((candidate as Record<string, unknown>).packageId) : "unknown";
    const revision = Number.isInteger((candidate as Record<string, unknown>)?.revision) ? Number((candidate as Record<string, unknown>).revision) : 1;
    if (error) return this.#quarantine(packageId, revision, error, now);

    const value = candidate as PublicationPackageV1;
    if (!verifyPackage(value, publicKey)) return this.#quarantine(value.packageId, value.revision, "invalid signature or corrupted package", now);
    if (value.revision <= (this.#maxRevision.get(value.packageId) ?? 0)) {
      return this.#quarantine(value.packageId, value.revision, "replay or stale revision", now);
    }

    this.#current = structuredClone(value);
    this.#maxRevision.set(value.packageId, value.revision);
    const accepted = receipt("accepted", value.packageId, value.revision, now, value.revision);
    this.receipts.push(accepted);
    return accepted;
  }

  recordFeedOutage(now = new Date()): PublicationReceiptV1 {
    return this.#quarantine(this.#current?.packageId ?? "feed", this.#current?.revision ?? 1, "feed unavailable; last-known-good retained", now);
  }

  withdraw(value: WithdrawalTombstoneV1, publicKey: KeyObject, now = new Date()): PublicationReceiptV1 {
    const retained = this.#current?.revision ?? null;
    if (value.schemaVersion !== "withdrawal-tombstone.v1" || this.#tombstones.has(value.tombstoneId)) {
      return this.#quarantine(value.targetPackageId, value.targetRevision, "invalid or replayed tombstone", now);
    }
    if (!verifyTombstone(value, publicKey)) return this.#quarantine(value.targetPackageId, value.targetRevision, "invalid tombstone signature", now);
    if (!this.#current || this.#current.packageId !== value.targetPackageId || this.#current.revision !== value.targetRevision) {
      return this.#quarantine(value.targetPackageId, value.targetRevision, "tombstone target is not the exact live revision", now);
    }
    this.#tombstones.add(value.tombstoneId);
    this.#current = null;
    const withdrawn = receipt("withdrawn", value.targetPackageId, value.targetRevision, now, null, value.reasonCode);
    this.receipts.push(withdrawn);
    return withdrawn;
  }

  #quarantine(packageId: string, revision: number, reason: string, now: Date): PublicationReceiptV1 {
    const quarantined = receipt("quarantined", packageId, Math.max(1, revision), now, this.#current?.revision ?? null, reason);
    this.receipts.push(quarantined);
    return quarantined;
  }
}
