/**
 * Canonical Victoroff offers exposed through the MCP connector.
 * Mirrors the offers published at https://victoroffgroup.com/#offers.
 * Update this file whenever the published offers change.
 */

export interface Offer {
  id: string;
  name: string;
  price: string;
  priceUsd: number | null;
  timing: string;
  summary: string;
  includes: string[];
  startUrl: string;
}

export const CONTACT_EMAIL = "davidvictoroff85@gmail.com";
export const SITE_URL = "https://victoroffgroup.com";
export const ENGAGEMENT_URL = "https://victoroffgroup.com/engagement/";

export const OFFERS: readonly Offer[] = [
  {
    id: "workflow_reconstruction_snapshot",
    name: "Workflow Reconstruction Snapshot",
    price: "$2,500 fixed fee",
    priceUsd: 2500,
    timing: "Target 5 business days after scope and evidence acceptance",
    summary:
      "One consequential outcome, reconstructed from its records: what happened, who or what acted, what authorized it, and what the evidence cannot explain.",
    includes: [
      "Sourced reconstruction chain and executive finding",
      "Authority map: capability versus delegated permission",
      "Evidence-gap register and recommended next step",
    ],
    startUrl: ENGAGEMENT_URL,
  },
  {
    id: "ai_authority_evidence_assessment",
    name: "AI Authority & Evidence Assessment",
    price: "From $12,500",
    priceUsd: 12500,
    timing: "Scoped after a Snapshot or discovery call",
    summary:
      "A review of authority, permissions, provenance, and human oversight across an agreed evidence set.",
    includes: [
      "Use-case, authority, and permission inventory",
      "Human-review, decision-right, and provenance findings",
      "Prioritized remediation and implementation roadmap",
    ],
    startUrl: ENGAGEMENT_URL,
  },
  {
    id: "victoroff_platform",
    name: "Victoroff Platform and Instrumentation Pilots",
    price: "By agreement",
    priceUsd: null,
    timing: "Scope and availability by agreement",
    summary:
      "Instrumentation pilots test how to capture missing records in an authorized environment; the platform is the longer-term product direction.",
    includes: ["Instrumentation pilot in an authorized environment", "Enterprise waitlist access"],
    startUrl: "https://victoroffgroup.com/waitlist/?interest=platform",
  },
];

export function findOffer(id: string): Offer {
  const offer = OFFERS.find((candidate) => candidate.id === id);
  if (!offer) throw new Error(`Unknown offer: ${id}`);
  return offer;
}
