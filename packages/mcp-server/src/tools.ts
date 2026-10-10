/**
 * Victoroff MCP tools.
 *
 * Every tool is deterministic and read-only. No tool invents findings,
 * verifies claims it cannot see, or writes to any external system.
 * When evidence is missing, tools say so explicitly.
 */

import { CONTACT_EMAIL, ENGAGEMENT_URL, OFFERS, SITE_URL, findOffer } from "./offers.js";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type Args = Record<string, unknown>;

export interface ToolResult {
  content: { type: "text"; text: string }[];
  structuredContent: { [key: string]: Json };
  isError?: boolean;
}

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: { [key: string]: Json };
  annotations: {
    title: string;
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
  run: (args: Args) => { [key: string]: Json };
}

export class ToolInputError extends Error {}

function optionalString(args: Args, key: string, max = 2000): string | null {
  const value = args[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new ToolInputError(`${key} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new ToolInputError(`${key} must be at most ${max} characters`);
  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(args: Args, key: string, max = 2000): string {
  const value = optionalString(args, key, max);
  if (value === null) throw new ToolInputError(`${key} is required`);
  return value;
}

function optionalStringList(args: Args, key: string): string[] {
  const value = args[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ToolInputError(`${key} must be an array of strings`);
  }
  if (value.length > 25) throw new ToolInputError(`${key} accepts at most 25 items`);
  return (value as string[]).map((item) => item.trim()).filter((item) => item.length > 0);
}

const readOnly = (title: string) => ({
  title,
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});

const listOffers: ToolDefinition = {
  name: "list_victoroff_offers",
  title: "List Victoroff Offers",
  description:
    "Lists Victoroff's published services for banks, fintechs, and payment operations, with price, timing, what each includes, and where to start. Use when someone asks what Victoroff offers, what it costs, or how to engage.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  annotations: readOnly("List Victoroff Offers"),
  run: () => ({
    offers: OFFERS.map((offer) => ({
      id: offer.id,
      name: offer.name,
      price: offer.price,
      priceUsd: offer.priceUsd,
      timing: offer.timing,
      summary: offer.summary,
      includes: [...offer.includes],
      startUrl: offer.startUrl,
    })),
    contact: CONTACT_EMAIL,
    website: SITE_URL,
    note: "Scope, evidence handling, and fee are confirmed in a written statement of work with Victoroff Investments Corp before any records are shared.",
  }),
};

const scopeSnapshot: ToolDefinition = {
  name: "scope_reconstruction_snapshot",
  title: "Scope a Reconstruction Snapshot",
  description:
    "Turns a description of one financial workflow and outcome into a draft scope for the $2,500 Victoroff Workflow Reconstruction Snapshot. Returns what the Snapshot would reconstruct, what you bring, what you receive, what is out of scope, and the open questions to settle before a statement of work. It does not assess, score, or judge the business.",
  inputSchema: {
    type: "object",
    properties: {
      workflow_name: { type: "string", description: "Short name, e.g. 'Supplier payment hold'" },
      outcome: {
        type: "string",
        description: "The consequential outcome to reconstruct, e.g. 'A $48,500 supplier payment was held after bank details changed'",
      },
      systems: {
        type: "array",
        items: { type: "string" },
        description: "Systems that hold the records, e.g. Stripe, NetSuite, Slack, email",
      },
      policies: {
        type: "array",
        items: { type: "string" },
        description: "Relevant policies or delegations, e.g. 'Payments release policy'",
      },
      workflow_owner: { type: "string", description: "Role that owns the workflow and will review the result" },
      evidence_handling: {
        type: "string",
        description: "Any constraints on sharing records, e.g. 'exports only, no production access'",
      },
    },
    required: ["workflow_name", "outcome"],
    additionalProperties: false,
  },
  annotations: readOnly("Scope a Reconstruction Snapshot"),
  run: (args) => {
    const workflowName = requiredString(args, "workflow_name", 200);
    const outcome = requiredString(args, "outcome", 4000);
    const systems = optionalStringList(args, "systems");
    const policies = optionalStringList(args, "policies");
    const owner = optionalString(args, "workflow_owner", 200);
    const evidenceHandling = optionalString(args, "evidence_handling", 1000);
    const snapshot = findOffer("workflow_reconstruction_snapshot");

    const openQuestions: string[] = [];
    if (systems.length === 0) openQuestions.push("Which systems hold the records for this outcome?");
    if (policies.length === 0) openQuestions.push("Which policies or delegations govern who may act in this workflow?");
    if (owner === null) openQuestions.push("Who owns this workflow and will review the reconstruction?");
    if (evidenceHandling === null) {
      openQuestions.push("How may records be shared (exports, redacted copies, screen share), and what confidentiality terms apply?");
    }

    return {
      offer: snapshot.name,
      price: snapshot.price,
      timing: snapshot.timing,
      workflow: { name: workflowName, outcome, systems, policies, owner, evidenceHandling },
      reconstructs: [
        "What happened, step by step, with a source record for each link",
        "Who or what acted at each step",
        "What authorized each action, and whether it was within delegated permission",
        "What the available evidence cannot explain",
      ],
      youBring: [
        "One agreed financial workflow and outcome",
        "Relevant policies",
        "A description of the records available",
      ],
      youReceive: [
        "Sourced reconstruction chain and executive finding",
        "Authority map: capability versus delegated permission",
        "Evidence-gap register and recommended next step",
      ],
      outOfScope: [
        "Changes to live systems or releasing any payment",
        "Workflows or outcomes other than the one named above",
        "Legal, compliance, financial, or investment advice",
      ],
      openQuestions,
      readyForStatementOfWork: openQuestions.length === 0,
      nextStep: `Discuss this scope at ${ENGAGEMENT_URL} or with ${CONTACT_EMAIL}. Scope, evidence handling, and fee are confirmed in a written statement of work before any records are shared.`,
      disclaimer: "Draft scope generated from the information provided. It is not an offer or a contract.",
    };
  },
};

const PROVENANCE_ELEMENTS = [
  { key: "requested_by", label: "Who requested the action" },
  { key: "authority_source", label: "Document or policy that grants the authority" },
  { key: "authorized_scope", label: "What the authority permits" },
  { key: "approved_by", label: "Who approved the action" },
  { key: "approved_at", label: "When it was approved" },
] as const;

const checkProvenance: ToolDefinition = {
  name: "check_action_provenance",
  title: "Check Action Provenance",
  description:
    "Checks whether the record supplied for a business action is complete: who requested it, what authority allowed it, what that authority covers, who approved it, when, and what evidence exists. Returns 'documented' only when every element is supplied; otherwise returns 'insufficient_provenance' and lists the gaps. It checks completeness of the supplied record only and does not independently verify any claim.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", description: "The action taken, e.g. 'Released $12,000 payment hold'" },
      requested_by: { type: "string" },
      authority_source: { type: "string", description: "Policy, delegation, or document granting authority" },
      authorized_scope: { type: "string", description: "Limits of that authority" },
      approved_by: { type: "string" },
      approved_at: { type: "string", description: "ISO 8601 date or date-time" },
      evidence: {
        type: "array",
        items: { type: "string" },
        description: "References to supporting records: ticket IDs, document links, log entries",
      },
    },
    required: ["action"],
    additionalProperties: false,
  },
  annotations: readOnly("Check Action Provenance"),
  run: (args) => {
    const action = requiredString(args, "action", 1000);
    const evidence = optionalStringList(args, "evidence");
    const elements: { [key: string]: Json }[] = [];
    const gaps: string[] = [];

    for (const element of PROVENANCE_ELEMENTS) {
      const value = optionalString(args, element.key, 1000);
      let status = value === null ? "missing" : "supplied";
      if (element.key === "approved_at" && value !== null && Number.isNaN(Date.parse(value))) {
        status = "unreadable";
      }
      if (status !== "supplied") gaps.push(`${element.label} (${status})`);
      elements.push({ element: element.key, label: element.label, status, value });
    }

    if (evidence.length === 0) gaps.push("Supporting evidence references (missing)");
    elements.push({
      element: "evidence",
      label: "Supporting evidence references",
      status: evidence.length > 0 ? "supplied" : "missing",
      value: evidence,
    });

    return {
      action,
      verdict: gaps.length === 0 ? "documented" : "insufficient_provenance",
      elements,
      gaps,
      limits:
        "This checks whether each element was supplied. It does not confirm that the people, documents, or evidence are authentic.",
    };
  },
};

export const TOOLS: readonly ToolDefinition[] = [listOffers, scopeSnapshot, checkProvenance];

export function callTool(name: string, args: Args): ToolResult {
  const tool = TOOLS.find((candidate) => candidate.name === name);
  if (!tool) throw new ToolInputError(`Unknown tool: ${name}`);
  try {
    const structuredContent = tool.run(args);
    return {
      content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
      structuredContent,
    };
  } catch (error) {
    if (error instanceof ToolInputError) {
      return {
        content: [{ type: "text", text: `Invalid input: ${error.message}` }],
        structuredContent: { error: error.message },
        isError: true,
      };
    }
    throw error;
  }
}
