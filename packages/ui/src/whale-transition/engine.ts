import { selectWhaleTransitionVariant } from "./policy";
import type {
  WhaleNavigationAdapter,
  WhaleNavigationRequest,
  WhaleTransitionClock,
  WhaleTransitionErrorContext,
  WhaleTransitionLayer,
  WhaleTransitionPhase,
  WhaleTransitionTiming,
} from "./types";

export const normalWhaleTransitionTiming: WhaleTransitionTiming = {
  waterRise: 140,
  breach: 240,
  descent: 220,
  settle: 150,
  reveal: 90,
};

export const reducedWhaleTransitionTiming: WhaleTransitionTiming = {
  waterRise: 50,
  breach: 40,
  descent: 35,
  settle: 35,
  reveal: 40,
};

export function totalWhaleTransitionTime(timing: WhaleTransitionTiming): number {
  return timing.waterRise + timing.breach + timing.descent + timing.settle + timing.reveal;
}

const systemClock: WhaleTransitionClock = {
  wait(milliseconds) {
    return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
  },
};

export interface WhaleTransitionEngineOptions {
  adapter: WhaleNavigationAdapter;
  layer: WhaleTransitionLayer;
  prefersReducedMotion: () => boolean;
  clock?: WhaleTransitionClock;
  onPhaseChange?: (phase: WhaleTransitionPhase) => void;
  onError?: (context: WhaleTransitionErrorContext) => void;
}

export class WhaleTransitionEngine {
  readonly #adapter: WhaleNavigationAdapter;
  readonly #layer: WhaleTransitionLayer;
  readonly #prefersReducedMotion: () => boolean;
  readonly #clock: WhaleTransitionClock;
  readonly #onPhaseChange: ((phase: WhaleTransitionPhase) => void) | undefined;
  readonly #onError: ((context: WhaleTransitionErrorContext) => void) | undefined;
  #active: Promise<void> | undefined;

  constructor(options: WhaleTransitionEngineOptions) {
    this.#adapter = options.adapter;
    this.#layer = options.layer;
    this.#prefersReducedMotion = options.prefersReducedMotion;
    this.#clock = options.clock ?? systemClock;
    this.#onPhaseChange = options.onPhaseChange;
    this.#onError = options.onError;
  }

  prime(): void {
    Promise.resolve(this.#layer.prime()).catch((error: unknown) => {
      this.#onError?.({ stage: "asset-preload", error });
    });
  }

  navigate(request: WhaleNavigationRequest): Promise<void> {
    if (this.#active) return this.#active;
    const transition = this.#run(request).finally(() => {
      if (this.#active === transition) this.#active = undefined;
    });
    this.#active = transition;
    return transition;
  }

  async #run(request: WhaleNavigationRequest): Promise<void> {
    const reducedMotion = this.#prefersReducedMotion();
    const timing = reducedMotion ? reducedWhaleTransitionTiming : normalWhaleTransitionTiming;
    const variant = selectWhaleTransitionVariant(request.from, request.to);
    let destinationSettled = false;
    const preload = Promise.resolve()
      .then(() => this.#adapter.preload(request.to))
      .catch((error: unknown) => {
        this.#onError?.({ stage: "destination-preload", error });
      })
      .finally(() => {
        destinationSettled = true;
      });

    this.prime();
    this.#layer.show(variant, reducedMotion);
    this.#phase("preloading");

    try {
      await this.#stage("water-rising", timing.waterRise);
      await this.#stage("breaching", timing.breach);
      this.#phase("masked");
      try {
        await this.#adapter.commit(request.to, request.historyAction);
      } catch (error) {
        this.#onError?.({ stage: "route-commit", error });
        throw error;
      }
      await this.#stage("descending", timing.descent);
      await this.#stage("settling", timing.settle);

      if (!destinationSettled) {
        this.#phase("loading-hold");
        await preload;
      }

      await this.#stage("revealing", timing.reveal);
      this.#phase("restoring-focus");
      try {
        await this.#adapter.focusDestination();
      } catch (error) {
        this.#onError?.({ stage: "focus", error });
      }
      const label = this.#adapter.destinationLabel?.(request.to) ?? request.to.pathname;
      this.#layer.announce("Navigated to " + label);
    } finally {
      this.#phase("idle");
      this.#layer.hide();
    }
  }

  async #stage(phase: WhaleTransitionPhase, milliseconds: number): Promise<void> {
    this.#phase(phase);
    await this.#clock.wait(milliseconds);
  }

  #phase(phase: WhaleTransitionPhase): void {
    this.#layer.setPhase(phase);
    this.#onPhaseChange?.(phase);
  }
}
