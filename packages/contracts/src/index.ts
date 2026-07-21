export type PublicClassification = "public";

export interface SourceReference {
  owner: string;
  url: string;
}

export interface ExternalHandoff {
  label: string;
  url: string;
  external: true;
}

export interface ShareholderActionV1 {
  schemaVersion: "shareholder-action.v1";
  id: string;
  title: string;
  shortLabel: string;
  audience: string;
  rule: string;
  deadline: string;
  preparation: string[];
  ownerSystem: string;
  handoff: ExternalHandoff;
  fallback: string;
  source: SourceReference;
  reviewedAt: string;
  expiresAt: string;
  classification: PublicClassification;
}

export interface PublicationPackageV1 {
  schemaVersion: "publication-package.v1";
  packageId: string;
  revision: number;
  publishedAt: string;
  expiresAt: string;
  classification: PublicClassification;
  content: {
    actions: ShareholderActionV1[];
  };
  assets: Array<{
    path: string;
    sha256: string;
    classification: PublicClassification;
  }>;
  signature: string;
}

export interface PublicationReceiptV1 {
  schemaVersion: "publication-receipt.v1";
  receiptId: string;
  packageId: string;
  revision: number;
  status: "accepted" | "quarantined" | "withdrawn";
  reason?: string;
  receivedAt: string;
  retainedRevision: number | null;
}

export interface WithdrawalTombstoneV1 {
  schemaVersion: "withdrawal-tombstone.v1";
  tombstoneId: string;
  targetPackageId: string;
  targetRevision: number;
  reasonCode: "superseded" | "rights-revoked" | "source-withdrawn" | "safety-correction";
  issuedAt: string;
  signature: string;
}

export type PublicationPackageUnsigned = Omit<PublicationPackageV1, "signature">;
export type WithdrawalTombstoneUnsigned = Omit<WithdrawalTombstoneV1, "signature">;
