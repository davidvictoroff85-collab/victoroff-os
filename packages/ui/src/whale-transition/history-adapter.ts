import type { WhaleHistoryAction, WhaleNavigationAdapter } from "./types";

export interface HistoryNavigationAdapterOptions {
  window: Window;
  document: Document;
  preload?: (to: URL) => Promise<void> | void;
  render: (to: URL, historyAction: WhaleHistoryAction) => Promise<void> | void;
  focusDestination?: () => Promise<void> | void;
  destinationLabel?: (to: URL) => string;
}

function focusMainDestination(document: Document): void {
  const target = document.querySelector<HTMLElement>("[data-route-focus], main#main, main, h1");
  if (!target) return;
  if (!target.matches("a, button, input, select, textarea, [tabindex]")) target.tabIndex = -1;
  target.focus({ preventScroll: true });
}

export function createHistoryNavigationAdapter(options: HistoryNavigationAdapterOptions): WhaleNavigationAdapter {
  return {
    preload: options.preload ?? (() => undefined),
    async commit(to, historyAction) {
      if (historyAction === "push") options.window.history.pushState(null, "", to);
      if (historyAction === "replace") options.window.history.replaceState(null, "", to);
      await options.render(to, historyAction);
    },
    focusDestination: options.focusDestination ?? (() => focusMainDestination(options.document)),
    destinationLabel: options.destinationLabel ?? (() => options.document.title),
  };
}
