import "@victoroff/ui/styles.css";
import "./stewardship.css";
import { syntheticStaffRecords } from "@victoroff/fixtures";

const gate = document.querySelector<HTMLElement>("[data-gate]");
const workspace = document.querySelector<HTMLElement>("[data-workspace]");
const enter = document.querySelector<HTMLButtonElement>("[data-enter]");
const records = document.querySelector<HTMLElement>("[data-records]");
const eventOutput = document.querySelector<HTMLElement>("[data-event]");

enter?.addEventListener("click", () => {
  if (gate) gate.hidden = true;
  if (workspace) workspace.hidden = false;
  document.getElementById("queue-title")?.focus();
});

if (records) {
  for (const record of syntheticStaffRecords) {
    const article = document.createElement("article");
    article.innerHTML = `
      <div class="record-id"><span>${record.id}</span><span>REV ${record.revision}</span></div>
      <div class="record-main"><p class="eyebrow">${record.owner}</p><h2>${record.title}</h2><p>State: <strong>${record.state.replace("_", " ")}</strong></p></div>
      <button class="button" type="button">Inspect exact revision</button>
    `;
    article.querySelector("button")?.addEventListener("click", () => {
      if (eventOutput) {
        eventOutput.textContent = JSON.stringify(
          {
            schemaVersion: "audit-event.v1",
            recordId: record.id,
            exactRevision: record.revision,
            command: "inspect",
            actor: "synthetic-reviewer",
            authority: "not-effective-demo-only",
            persisted: false,
          },
          null,
          2,
        );
      }
    });
    records.append(article);
  }
}
