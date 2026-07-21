import "@victoroff/ui/styles.css";
import "./site.css";
import { shareholderActions } from "@victoroff/fixtures";
import { activateTabs } from "@victoroff/ui";

document.documentElement.classList.add("enhanced");

const actionButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-action-tab]")];
const actionPanels = [...document.querySelectorAll<HTMLElement>("[data-action-result]")];
if (actionButtons.length === shareholderActions.length && actionPanels.length === shareholderActions.length) {
  activateTabs({
    buttons: actionButtons,
    panels: actionPanels,
    selectedId: "action-panel-distribution-records",
    onSelect: (id) => {
      const panel = document.getElementById(id);
      panel?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
    },
  });
}

const ringDetails = {
  center: {
    index: "Center",
    title: "Shareholder success",
    works: "Find the right task, prepare once, complete it in the owning system, and keep a human fallback.",
    owner: "Shareholder",
    data: "No data stored by the public guide.",
    expands: "The invariant every later ring must protect.",
  },
  guide: {
    index: "Ring 1",
    title: "Guide",
    works: "Anonymous deadlines, eligibility, preparation, sources, and external handoffs.",
    owner: "Public Communications",
    data: "Allow-listed public information only.",
    expands: "Adds an intelligent front door without becoming a record system.",
  },
  connect: {
    index: "Ring 2",
    title: "Connect",
    works: "Verified handoffs and health checks for myBBNC, BBNCVote, ATS tools, forms, and support.",
    owner: "Integration owners",
    data: "Endpoint health and public route metadata; no shareholder payloads.",
    expands: "Makes transfers observable while the owning system remains authoritative.",
  },
  operate: {
    index: "Ring 3",
    title: "Operate",
    works: "Content drafting, review, exact-revision approval, evidence, release, and outcomes.",
    owner: "BBNC Stewardship staff",
    data: "Internal workflow, authority, review, risk, and audit records.",
    expands: "Turns publication into an accountable operating practice.",
  },
  rebuild: {
    index: "Ring 4",
    title: "Rebuild",
    works: "A complete BBNC.net public experience powered by signed Stewardship releases.",
    owner: "BBNC product and communications",
    data: "Verified public packages and licensed public assets.",
    expands: "Replaces fragmented navigation with a governed public product.",
  },
  own: {
    index: "Ring 5",
    title: "Own",
    works: "BBNC-controlled repositories, infrastructure, operations, recovery, and measurement.",
    owner: "BBNC",
    data: "All institutional assets remain in BBNC-controlled accounts.",
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
