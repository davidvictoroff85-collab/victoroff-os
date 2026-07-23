import { WhaleTransitionEngine, type WhaleTransitionEngineOptions } from "./engine";
import { createWhaleTransitionLayer } from "./layer";
import { qualifiesForWhaleTransition } from "./policy";
import type { WhaleHistoryAction, WhaleNavigationAdapter, WhaleTransitionLayer } from "./types";

export interface WhaleTransitionProviderOptions {
  window: Window;
  document: Document;
  adapter: WhaleNavigationAdapter;
  layer?: WhaleTransitionLayer;
  clock?: WhaleTransitionEngineOptions["clock"];
  onPhaseChange?: WhaleTransitionEngineOptions["onPhaseChange"];
  onError?: WhaleTransitionEngineOptions["onError"];
}

export class WhaleTransitionProvider {
  readonly #window: Window;
  readonly #document: Document;
  readonly #layer: WhaleTransitionLayer;
  readonly #engine: WhaleTransitionEngine;
  #started = false;
  #lastUrl: URL;

  constructor(options: WhaleTransitionProviderOptions) {
    this.#window = options.window;
    this.#document = options.document;
    this.#layer = options.layer ?? createWhaleTransitionLayer(options.document);
    const engineOptions: WhaleTransitionEngineOptions = {
      adapter: options.adapter,
      layer: this.#layer,
      prefersReducedMotion: () => options.window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
    if (options.clock) engineOptions.clock = options.clock;
    if (options.onPhaseChange) engineOptions.onPhaseChange = options.onPhaseChange;
    if (options.onError) engineOptions.onError = options.onError;
    this.#engine = new WhaleTransitionEngine(engineOptions);
    this.#lastUrl = new URL(options.window.location.href);
  }

  start(): () => void {
    if (this.#started) return () => this.stop();
    this.#started = true;
    this.#engine.prime();
    this.#document.addEventListener("click", this.#onClick, true);
    this.#window.addEventListener("popstate", this.#onPopState);
    return () => this.stop();
  }

  stop(): void {
    if (!this.#started) return;
    this.#document.removeEventListener("click", this.#onClick, true);
    this.#window.removeEventListener("popstate", this.#onPopState);
    this.#layer.destroy();
    this.#started = false;
  }

  async navigate(to: URL | string, historyAction: WhaleHistoryAction = "push"): Promise<void> {
    const destination = to instanceof URL ? to : new URL(to, this.#window.location.href);
    const from = new URL(this.#window.location.href);
    await this.#engine.navigate({ from, to: destination, historyAction });
    this.#lastUrl = destination;
  }

  readonly #onClick = (event: MouseEvent): void => {
    const element = event.target instanceof Element ? event.target : null;
    const anchor = element?.closest<HTMLAnchorElement>("a[href]");
    if (!anchor) return;

    const currentUrl = new URL(this.#window.location.href);
    const destinationUrl = new URL(anchor.href, currentUrl);
    if (!qualifiesForWhaleTransition({
      currentUrl,
      destinationUrl,
      button: event.button,
      defaultPrevented: event.defaultPrevented,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      download: anchor.hasAttribute("download"),
      target: anchor.target,
      rel: anchor.rel,
    })) return;

    event.preventDefault();
    void this.navigate(destinationUrl, "push").catch(() => {
      this.#window.location.assign(destinationUrl.href);
    });
  };

  readonly #onPopState = (): void => {
    const destinationUrl = new URL(this.#window.location.href);
    if (!qualifiesForWhaleTransition({ currentUrl: this.#lastUrl, destinationUrl })) {
      this.#lastUrl = destinationUrl;
      return;
    }
    void this.#engine
      .navigate({ from: this.#lastUrl, to: destinationUrl, historyAction: "pop" })
      .then(() => {
        this.#lastUrl = destinationUrl;
      });
  };
}
