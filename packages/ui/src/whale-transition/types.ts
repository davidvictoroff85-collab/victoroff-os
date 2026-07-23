export const whaleTransitionVariants = [
  "standard",
  "left-to-right",
  "right-to-left",
  "distant",
  "close",
  "tail-descent",
] as const;

export type WhaleTransitionVariant = (typeof whaleTransitionVariants)[number];

export type WhaleTransitionPhase =
  | "idle"
  | "preloading"
  | "water-rising"
  | "breaching"
  | "masked"
  | "descending"
  | "settling"
  | "loading-hold"
  | "revealing"
  | "restoring-focus";

export type WhaleHistoryAction = "push" | "replace" | "pop";

export interface WhaleNavigationRequest {
  from: URL;
  to: URL;
  historyAction: WhaleHistoryAction;
}

export interface WhaleNavigationAdapter {
  preload(to: URL): Promise<void> | void;
  commit(to: URL, historyAction: WhaleHistoryAction): Promise<void> | void;
  focusDestination(): Promise<void> | void;
  destinationLabel?(to: URL): string;
}

export interface WhaleTransitionLayer {
  prime(): Promise<void> | void;
  show(variant: WhaleTransitionVariant, reducedMotion: boolean): void;
  setPhase(phase: WhaleTransitionPhase): void;
  announce(message: string): void;
  hide(): void;
  destroy(): void;
}

export interface WhaleTransitionClock {
  wait(milliseconds: number): Promise<void>;
}

export interface WhaleTransitionTiming {
  waterRise: number;
  breach: number;
  descent: number;
  settle: number;
  reveal: number;
}

export interface WhaleTransitionErrorContext {
  stage: "asset-preload" | "destination-preload" | "route-commit" | "focus";
  error: unknown;
}
