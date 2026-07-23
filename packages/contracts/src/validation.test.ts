import { describe, it, expect } from "vitest";
import {
  isGovernanceDocumentV1,
  isActionIntentV1,
  isGovernanceResolutionV1,
  isDeliveryCheckpointV1
} from "./validation.js";

describe("Runtime Validations", () => {
  it("validates GovernanceDocumentV1 correctly", () => {
    const valid = {
      schemaVersion: "governance-document.v1",
      documentId: "doc-1",
      title: "Test Doc",
      version: "1.0",
      status: "active",
      effectiveDate: "2023-01-01T00:00:00Z",
      sections: [
        {
          sectionId: "s1",
          title: "Section 1",
          content: "Content 1"
        }
      ],
      classification: "public"
    };

    expect(isGovernanceDocumentV1(valid)).toBe(true);
    expect(isGovernanceDocumentV1({ ...valid, status: "invalid" })).toBe(false);
    expect(isGovernanceDocumentV1({ ...valid, documentId: undefined })).toBe(false);
  });

  it("validates ActionIntentV1 correctly", () => {
    const valid = {
      schemaVersion: "action-intent.v1",
      intentId: "intent-1",
      actionId: "act-1",
      shareholderId: "sh-1",
      status: "pending",
      submittedAt: "2023-01-01T00:00:00Z",
      payload: { some: "data" }
    };

    expect(isActionIntentV1(valid)).toBe(true);
    expect(isActionIntentV1({ ...valid, status: "done" })).toBe(false);
  });

  it("validates GovernanceResolutionV1 correctly", () => {
    const valid = {
      schemaVersion: "governance-resolution.v1",
      resolutionId: "res-1",
      title: "Test Res",
      description: "A resolution",
      proposedBy: "sh-1",
      status: "proposed",
      proposedAt: "2023-01-01T00:00:00Z",
      classification: "public"
    };

    expect(isGovernanceResolutionV1(valid)).toBe(true);
    expect(isGovernanceResolutionV1({ ...valid, resolutionId: 123 })).toBe(false);
  });

  it("validates DeliveryCheckpointV1 correctly", () => {
    const valid = {
      schemaVersion: "delivery-checkpoint.v1",
      checkpointId: "cp-1",
      title: "Test Checkpoint",
      claim: "open",
      status: "pending",
      updatedAt: "2023-01-01T00:00:00Z"
    };

    expect(isDeliveryCheckpointV1(valid)).toBe(true);
    expect(isDeliveryCheckpointV1({ ...valid, status: "unknown" })).toBe(false);
  });
});
