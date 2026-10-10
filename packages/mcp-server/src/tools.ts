/**
 * Victoroff MCP tools.
 *
 * Every tool is deterministic and read-only. No tool invents findings,
 * verifies claims it cannot see, or writes to any external system.
 * When evidence is missing, tools say so explicitly.
 */

import { CONTACT_EMAIL, OFFERS, SITE_URL, findOffer } from "./offers.js";

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

function optionalPositiveNumber(args: Args, key: string): number | null {
  const value = args[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new ToolInputError(`${key} must be a non-negative number`);
  }
  return value;
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
    "Lists Victoroff's current services with prices, what each includes, and the secure Stripe payment link. Use when someone asks what Victoroff offers, what it costs, or how to start.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  annotations: readOnly("List Victoroff Offers"),
  run: () => ({
    offers: OFFERS.map((offer) => ({
      id: offer.id,
      name: offer.name,
      priceUsd: offer.priceUsd,
      billing: offer.billing,
      summary: offer.summary,
      includes: [...offer.includes],
      paymentLink: offer.paymentLink,
    })),
    contact: CONTACT_EMAIL,
    website: SITE_URL,
    note: "Agree on scope in writing before paying. Questions go to the contact email.",
  }),
};

const scopePilot: ToolDefinition = {
  name: "scope_workflow_pilot",
  title: "Scope a Workflow Pilot",
  description:
    "Turns a description of one business workflow into a draft scope for the $1,495, 14-day Victoroff Workflow Intelligence Pilot. Returns what the pilot would cover, what is out of scope, the open questions that must be answered before starting, and the payment link. It does not assess or score the business.",
  inputSchema: {
    type: "object",
    properties: {
      workflow_name: { type: "string", description: "Short name, e.g. 'Payment hold review'" },
      description: {
        type: "string",
        description: "How the workflow works today: who does what, in which systems, and where it breaks",
      },
      monthly_volume: { type: "number", description: "Approximate items handled per month" },
      systems: {
        type: "array",
        items: { type: "string" },
        description: "Systems the workflow touches, e.g. Stripe, HubSpot, Gmail",
      },
      workflow_owner: { type: "string", description: "Role that owns the workflow today" },
      success_metric: {
        type: "string",
        description: "What a successful pilot would change, e.g. 'review time under 1 hour'",
      },
    },
    required: ["workflow_name", "description"],
    additionalProperties: false,
  },
  annotations: readOnly("Scope a Workflow Pilot"),
  run: (args) => {
    const workflowName = requiredString(args, "workflow_name", 200);
    const description = requiredString(args, "description", 4000);
    const monthlyVolume = optionalPositiveNumber(args, "monthly_volume");
    const systems = optionalStringList(args, "systems");
    const owner = optionalString(args, "workflow_owner", 200);
    const successMetric = optionalString(args, "success_metric", 500);
    const pilot = findOffer("workflow_intelligence_pilot");

    const openQuestions: string[] = [];
    if (monthlyVolume === null) openQuestions.push("About how many items does this workflow handle per month?");
    if (systems.length === 0) openQuestions.push("Which systems does the workflow touch?");
    if (owner === null) openQuestions.push("Who owns this workflow today, and who approves exceptions?");
    if (successMetric === null) openQuestions.push("What measurable change would make the pilot a success?");
    openQuestions.push("Can sample or exported records be shared for the pilot, and are there data-handling rules?");

    return {
      offer: pilot.name,
      priceUsd: pilot.priceUsd,
      durationDays: 14,
      workflow: {
        name: workflowName,
        description,
        monthlyVolume,
        systems,
        owner,
        successMetric,
      },
      inScope: [
        `Map the "${workflowName}" workflow end to end: steps, owners, approvals, handoffs, and exceptions`,
        "Design and build an AI-assisted intake or triage step for this workflow",
        "Working demo on agreed sample data",
        "Implementation plan for production rollout",
      ],
      outOfScope: [
        "Production deployment or changes to live systems",
        "Workflows other than the one named above",
        "Legal or regulatory compliance opinions",
      ],
      openQuestions,
      readyToStart: openQuestions.length === 1,
      nextStep: `Confirm the scope in writing with ${CONTACT_EMAIL}, then pay with the link below.`,
      paymentLink: pilot.paymentLink,
      disclaimer: "Draft scope generated from the information provided. Final scope is agreed in writing.",
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

export const TOOLS: readonly ToolDefinition[] = [listOffers, scopePilot, checkProvenance];

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
