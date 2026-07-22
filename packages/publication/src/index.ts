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

type DeepReadonly<T> = T extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : T extends object
    ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
    : T;

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

function dateTime(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offset] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth[month - 1]! ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }
  if (!/^[Zz]$/.test(offset!)) {
    const [offsetHour, offsetMinute] = offset!.slice(1).split(":").map(Number);
    if (offsetHour! > 23 || offsetMinute! > 59) return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function httpsUrl(value: unknown): boolean {
  if (!nonEmptyString(value) || !/^https:\/\//.test(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validAction(action: unknown, now: Date): action is ShareholderActionV1 {
  if (!isRecord(action)) return false;
  const value = action;
  if (
    !exactKeys(value, [
      "schemaVersion",
      "id",
      "title",
      "shortLabel",
      "audience",
      "rule",
      "deadline",
      "preparation",
      "ownerSystem",
      "handoff",
      "fallback",
      "source",
      "reviewedAt",
      "expiresAt",
      "classification",
    ])
  ) {
    return false;
  }
  if (!isRecord(value.handoff) || !exactKeys(value.handoff, ["label", "url", "external"])) return false;
  if (!isRecord(value.source) || !exactKeys(value.source, ["owner", "url"])) return false;
  const expiresAt = validDate(value.expiresAt) ? Date.parse(`${value.expiresAt}T23:59:59Z`) : Number.NaN;
  return (
    value.schemaVersion === "shareholder-action.v1" &&
    value.classification === "public" &&
    nonEmptyString(value.id) &&
    nonEmptyString(value.title) &&
    nonEmptyString(value.shortLabel) &&
    nonEmptyString(value.audience) &&
    nonEmptyString(value.rule) &&
    nonEmptyString(value.deadline) &&
    Array.isArray(value.preparation) &&
    value.preparation.length > 0 &&
    value.preparation.every(nonEmptyString) &&
    nonEmptyString(value.ownerSystem) &&
    nonEmptyString(value.handoff.label) &&
    httpsUrl(value.handoff.url) &&
    value.handoff.external === true &&
    nonEmptyString(value.fallback) &&
    nonEmptyString(value.source.owner) &&
    httpsUrl(value.source.url) &&
    validDate(value.reviewedAt) &&
    Number.isFinite(expiresAt) &&
    expiresAt >= now.getTime()
  );
}

function safeAssetPath(value: unknown): boolean {
  if (!nonEmptyString(value) || value !== value.trim() || value.startsWith("/") || value.includes("\\")) return false;
  const parts = value.split("/");
  return parts.every((part) => part !== "" && part !== "." && part !== ".." && /^[a-zA-Z0-9._-]+$/.test(part));
}

function packageShapeError(value: unknown, now: Date): string | null {
  if (!value || typeof value !== "object") return "package is not an object";
  const packageValue = value as Record<string, unknown>;
  const keys = ["schemaVersion", "packageId", "revision", "publishedAt", "expiresAt", "classification", "content", "assets", "signature"];
  if (!exactKeys(packageValue, keys)) return "package contains missing or non-allow-listed fields";
  if (packageValue.schemaVersion !== "publication-package.v1") return "schema mismatch";
  if (packageValue.classification !== "public") return "package is not public";
  if (!nonEmptyString(packageValue.packageId) || !Number.isInteger(packageValue.revision) || Number(packageValue.revision) < 1) {
    return "package identity is invalid";
  }
  const publishedAt = dateTime(packageValue.publishedAt);
  const expiresAt = dateTime(packageValue.expiresAt);
  if (!nonEmptyString(packageValue.signature) || publishedAt === null || expiresAt === null) return "signature, publication, or expiry timestamp is invalid";
  if (expiresAt <= now.getTime()) return "package expired";
  const content = packageValue.content as Record<string, unknown> | undefined;
  if (!content || !exactKeys(content, ["actions"]) || !Array.isArray(content.actions)) return "content allow-list failed";
  if (!content.actions.every((action) => validAction(action, now))) return "action schema or source expiry failed";
  if (!Array.isArray(packageValue.assets)) return "assets are invalid";
  for (const asset of packageValue.assets) {
    if (!asset || typeof asset !== "object") return "asset is invalid";
    const candidate = asset as Record<string, unknown>;
    if (!exactKeys(candidate, ["path", "sha256", "classification"])) return "asset allow-list failed";
    if (!safeAssetPath(candidate.path)) return "asset path is invalid";
    if (candidate.classification !== "public" || typeof candidate.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(candidate.sha256)) {
      return "asset hash or classification failed";
    }
  }
  return null;
}

function tombstoneShapeError(value: unknown): string | null {
  if (!isRecord(value)) return "tombstone is not an object";
  if (!exactKeys(value, ["schemaVersion", "tombstoneId", "targetPackageId", "targetRevision", "reasonCode", "issuedAt", "signature"])) {
    return "tombstone contains missing or non-allow-listed fields";
  }
  if (value.schemaVersion !== "withdrawal-tombstone.v1") return "tombstone schema mismatch";
  if (!nonEmptyString(value.tombstoneId) || !nonEmptyString(value.targetPackageId) || !Number.isInteger(value.targetRevision) || Number(value.targetRevision) < 1) {
    return "tombstone identity is invalid";
  }
  if (!["superseded", "rights-revoked", "source-withdrawn", "safety-correction"].includes(String(value.reasonCode))) {
    return "tombstone reason is invalid";
  }
  if (dateTime(value.issuedAt) === null || !nonEmptyString(value.signature)) return "tombstone issuance or signature is invalid";
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
  return deepFreeze({
    schemaVersion: "publication-receipt.v1",
    receiptId: randomUUID(),
    packageId,
    revision,
    status,
    ...(reason ? { reason } : {}),
    receivedAt: receivedAt.toISOString(),
    retainedRevision,
  });
}

export class PublicationConsumer {
  #current: PublicationPackageV1 | null = null;
  readonly #maxRevision = new Map<string, number>();
  readonly #tombstones = new Set<string>();
  readonly #receipts: PublicationReceiptV1[] = [];

  current(): DeepReadonly<PublicationPackageV1> | null {
    return this.#current;
  }

  get receipts(): readonly DeepReadonly<PublicationReceiptV1>[] {
    return deepFreeze([...this.#receipts]);
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

    this.#current = deepFreeze(structuredClone(value)) as PublicationPackageV1;
    this.#maxRevision.set(value.packageId, value.revision);
    const accepted = receipt("accepted", value.packageId, value.revision, now, value.revision);
    this.#receipts.push(accepted);
    return accepted;
  }

  recordFeedOutage(now = new Date()): PublicationReceiptV1 {
    return this.#quarantine(this.#current?.packageId ?? "feed", this.#current?.revision ?? 1, "feed unavailable; last-known-good retained", now);
  }

  withdraw(value: WithdrawalTombstoneV1, publicKey: KeyObject, now = new Date()): PublicationReceiptV1 {
    const candidate: Record<string, unknown> = isRecord(value) ? value : {};
    const packageId = nonEmptyString(candidate.targetPackageId) ? candidate.targetPackageId : "unknown";
    const revision = Number.isInteger(candidate.targetRevision) ? Number(candidate.targetRevision) : 1;
    const error = tombstoneShapeError(value);
    if (error) return this.#quarantine(packageId, revision, error, now);
    if (this.#tombstones.has(value.tombstoneId)) return this.#quarantine(value.targetPackageId, value.targetRevision, "replayed tombstone", now);
    if (!verifyTombstone(value, publicKey)) return this.#quarantine(value.targetPackageId, value.targetRevision, "invalid tombstone signature", now);
    if (!this.#current || this.#current.packageId !== value.targetPackageId || this.#current.revision !== value.targetRevision) {
      return this.#quarantine(value.targetPackageId, value.targetRevision, "tombstone target is not the exact live revision", now);
    }
    this.#tombstones.add(value.tombstoneId);
    this.#current = null;
    const withdrawn = receipt("withdrawn", value.targetPackageId, value.targetRevision, now, null, value.reasonCode);
    this.#receipts.push(withdrawn);
    return withdrawn;
  }

  #quarantine(packageId: string, revision: number, reason: string, now: Date): PublicationReceiptV1 {
    const quarantined = receipt("quarantined", packageId, Math.max(1, revision), now, this.#current?.revision ?? null, reason);
    this.#receipts.push(quarantined);
    return quarantined;
  }
}
