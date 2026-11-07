import "@victoroff/ui/styles.css";
import "./site.css";
import { shareholderActions as workflowActions } from "@victoroff/fixtures";
import { activateTabs } from "@victoroff/ui";

document.documentElement.classList.add("enhanced");

const actionButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-action-tab]")];
const actionPanels = [...document.querySelectorAll<HTMLElement>("[data-action-result]")];
if (actionButtons.length === workflowActions.length && actionPanels.length === workflowActions.length) {
  activateTabs({
    buttons: actionButtons,
    panels: actionPanels,
    selectedId: "action-panel-bank-detail-change",
    onSelect: (id, userInitiated) => {
      if (!userInitiated) return;
      const panel = document.getElementById(id);
      panel?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
    },
  });
}

const ringDetails = {
  center: {
    index: "Center",
    title: "Explainable outcome",
    works: "Every consequential decision connects to its trigger, actor, authority, policy, and evidence.",
    owner: "The accountable workflow owner",
    data: "No data stored by this concept.",
    expands: "The invariant every later ring must protect.",
  },
  guide: {
    index: "Ring 1",
    title: "Reconstruct",
    works: "One consequential outcome, reconstructed from its records, with an authority map and evidence gaps.",
    owner: "The workflow owner",
    data: "An agreed evidence set, handled under a written statement of work.",
    expands: "Proves the method on one bounded question before any broader commitment.",
  },
  connect: {
    index: "Ring 2",
    title: "Assess",
    works: "A review of authority, permissions, provenance, and human oversight across workflows.",
    owner: "Operations and risk",
    data: "An agreed evidence set across the workflows in scope.",
    expands: "Turns repeated gaps into a prioritized remediation roadmap.",
  },
  operate: {
    index: "Ring 3",
    title: "Instrument",
    works: "Capture the records that were missing, in an authorized environment.",
    owner: "The client's engineering and risk teams",
    data: "Client-controlled systems and records.",
    expands: "Makes the next outcome explainable as it happens.",
  },
  rebuild: {
    index: "Ring 4",
    title: "Platform",
    works: "Continuous reconstruction, delegated-authority checks, approvals, and audit trails.",
    owner: "The client",
    data: "Client-controlled; Victoroff never holds authority to act on a payment.",
    expands: "Replaces after-the-fact investigation with a governed operating record.",
  },
  own: {
    index: "Ring 5",
    title: "Own",
    works: "Client-controlled repositories, infrastructure, operations, recovery, and measurement.",
    owner: "The client",
    data: "All records remain in client-controlled accounts.",
    expands: "Removes vendor dependency and sustains continuous improvement.",
  },
} as const;

const ringButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-ring]")];
const ringOutput = {
  index: document.querySelector<HTMLElement>("[data-ring-output='index']"),
  title: document.querySelector<HTMLElement>("[data-ring-output='title']"),
  works: document.querySelector<HTMLElement>("[data-ring-output='works']"),
  owner: document.querySelector<HTMLElement>("[data-ring-output='owner']"),
  data: document.querySelector<HTMLElement>("[data-ring-output='data']"),
  expands: document.querySelector<HTMLElement>("[data-ring-output='expands']"),
};

function selectRing(key: keyof typeof ringDetails) {
  const detail = ringDetails[key];
  for (const button of ringButtons) button.setAttribute("aria-pressed", String(button.dataset.ring === key));
  for (const field of Object.keys(ringOutput) as Array<keyof typeof ringOutput>) {
    if (ringOutput[field]) ringOutput[field].textContent = detail[field];
  }
}

for (const button of ringButtons) {
  button.addEventListener("click", () => selectRing(button.dataset.ring as keyof typeof ringDetails));
}

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());
