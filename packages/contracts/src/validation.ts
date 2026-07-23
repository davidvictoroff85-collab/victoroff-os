import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import governanceDocumentSchema from "../schemas/governance-document.v1.schema.json" with { type: "json" };
import actionIntentSchema from "../schemas/action-intent.v1.schema.json" with { type: "json" };
import governanceResolutionSchema from "../schemas/governance-resolution.v1.schema.json" with { type: "json" };
import deliveryCheckpointSchema from "../schemas/delivery-checkpoint.v1.schema.json" with { type: "json" };

const ajv = new Ajv2020({ allErrors: true, strict: false });
// @ts-ignore
addFormats(ajv);

const validateGovernanceDocument = ajv.compile(governanceDocumentSchema);
const validateActionIntent = ajv.compile(actionIntentSchema);
const validateGovernanceResolution = ajv.compile(governanceResolutionSchema);
const validateDeliveryCheckpoint = ajv.compile(deliveryCheckpointSchema);

export function isGovernanceDocumentV1(data: unknown): data is import("./index.js").GovernanceDocumentV1 {
  return validateGovernanceDocument(data) as boolean;
}

export function isActionIntentV1(data: unknown): data is import("./index.js").ActionIntentV1 {
  return validateActionIntent(data) as boolean;
}

export function isGovernanceResolutionV1(data: unknown): data is import("./index.js").GovernanceResolutionV1 {
  return validateGovernanceResolution(data) as boolean;
}

export function isDeliveryCheckpointV1(data: unknown): data is import("./index.js").DeliveryCheckpointV1 {
  return validateDeliveryCheckpoint(data) as boolean;
}
