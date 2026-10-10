/**
 * Canonical Victoroff offers exposed through the MCP connector.
 * Prices and payment links mirror the live Stripe account (Victoroff).
 * Update this file whenever a Stripe price or payment link changes.
 */

export interface Offer {
  id: string;
  name: string;
  priceUsd: number;
  billing: "one_time" | "weekly";
  summary: string;
  includes: string[];
  paymentLink: string;
}

export const CONTACT_EMAIL = "davidvictoroff85@gmail.com";
export const SITE_URL = "https://victoroffgroup.com";

export const OFFERS: readonly Offer[] = [
  {
    id: "workflow_intelligence_pilot",
    name: "Victoroff Workflow Intelligence Pilot",
    priceUsd: 1495,
    billing: "one_time",
    summary:
      "Fixed 14-day pilot that maps one high-volume workflow and builds an AI-assisted intake or triage process for it.",
    includes: [
      "Map of one high-volume workflow: steps, owners, approvals, and handoffs",
      "AI-assisted intake or triage process for that workflow",
      "Working demo",
      "Implementation plan for production rollout",
    ],
    paymentLink: "https://buy.stripe.com/cNidRb9gL0bS3ns0vp18c0l",
  },
  {
    id: "consulting_weekly",
    name: "Victoroff Consulting Call (60 min, weekly)",
    priceUsd: 289,
    billing: "weekly",
    summary: "Weekly 60-minute founder-led working session on AI workflow, automation, and go-to-market.",
    includes: ["One 60-minute session per week", "Cancel any time"],
    paymentLink: "https://buy.stripe.com/cNi6oJ8cH7EkbTY7XR18c0j",
  },
  {
    id: "digital_private_audit",
    name: "Victoroff Digital Private Audit",
    priceUsd: 2500,
    billing: "one_time",
    summary:
      "Founder-led digital and brand intelligence audit with a prioritized 90-day opportunity map.",
    includes: [
      "Positioning and digital presence review",
      "Content and conversion review",
      "Competitive context",
      "Prioritized 90-day opportunity map",
    ],
    paymentLink: "https://buy.stripe.com/14AcN7eB5bUA1fk1zt18c0u",
  },
];

export function findOffer(id: string): Offer {
  const offer = OFFERS.find((candidate) => candidate.id === id);
  if (!offer) throw new Error(`Unknown offer: ${id}`);
  return offer;
}
