import { describe, expect, it, vi } from "vitest";
import {
  WhaleTransitionEngine,
  normalWhaleTransitionTiming,
  reducedWhaleTransitionTiming,
  totalWhaleTransitionTime,
} from "./engine";
import { qualifiesForWhaleTransition, selectWhaleTransitionVariant } from "./policy";
import { whaleTransitionVariants, type WhaleTransitionClock, type WhaleTransitionLayer, type WhaleTransitionPhase } from "./types";

function url(path: string): URL {
  return new URL(path, "https://victoroff.test");
}

function layerFixture() {
  const phases: WhaleTransitionPhase[] = [];
  const layer: WhaleTransitionLayer = {
    prime: vi.fn(),
    show: vi.fn(),
    setPhase: vi.fn((phase) => phases.push(phase)),
    announce: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn(),
  };
  return { layer, phases };
}

function clockFixture() {
  let elapsed = 0;
  const waits: number[] = [];
  const clock: WhaleTransitionClock = {
    async wait(milliseconds) {
      waits.push(milliseconds);
      elapsed += milliseconds;
    },
  };
  return { clock, waits, elapsed: () => elapsed };
}

describe("navigation qualification", () => {
  it("qualifies only meaningful same-origin page routes", () => {
    const currentUrl = url("/people#leadership");
    expect(qualifiesForWhaleTransition({ currentUrl, destinationUrl: url("/organizations") })).toBe(true);
    expect(qualifiesForWhaleTransition({ currentUrl, destinationUrl: url("/people#board") })).toBe(false);
    expect(qualifiesForWhaleTransition({ currentUrl, destinationUrl: new URL("https://example.test/people") })).toBe(false);
    expect(qualifiesForWhaleTransition({ currentUrl, destinationUrl: url("/documents"), metaKey: true })).toBe(false);
    expect(qualifiesForWhaleTransition({ currentUrl, destinationUrl: url("/documents"), target: "_blank" })).toBe(false);
    expect(qualifiesForWhaleTransition({ currentUrl, destinationUrl: url("/documents"), download: true })).toBe(false);
    expect(qualifiesForWhaleTransition({ currentUrl, destinationUrl: url("/documents"), defaultPrevented: true })).toBe(false);
  });

  it("selects a stable controlled variant without page input", () => {
    const from = url("/people");
    const to = url("/organizations");
    const variant = selectWhaleTransitionVariant(from, to);
    expect(whaleTransitionVariants).toContain(variant);
    expect(selectWhaleTransitionVariant(from, to)).toBe(variant);
  });
});

describe("WhaleTransitionEngine", () => {
  it("preloads concurrently, commits at the mask, and restores focus after an 840ms transition", async () => {
    const { layer, phases } = layerFixture();
    const clock = clockFixture();
    const events: string[] = [];
    const adapter = {
      preload: vi.fn(async () => { events.push("preload"); }),
      commit: vi.fn(async () => { events.push("commit@" + clock.elapsed()); }),
      focusDestination: vi.fn(() => { events.push("focus@" + clock.elapsed()); }),
      destinationLabel: () => "Organizations",
    };
    const engine = new WhaleTransitionEngine({ adapter, layer, clock: clock.clock, prefersReducedMotion: () => false });

    await engine.navigate({ from: url("/people"), to: url("/organizations"), historyAction: "push" });

    expect(totalWhaleTransitionTime(normalWhaleTransitionTiming)).toBe(840);
    expect(events[0]).toBe("preload");
    expect(events).toContain("commit@380");
    expect(events).toContain("focus@840");
    expect(adapter.commit).toHaveBeenCalledWith(url("/organizations"), "push");
    expect(layer.announce).toHaveBeenCalledWith("Navigated to Organizations");
    expect(phases).toEqual([
      "preloading",
      "water-rising",
      "breaching",
      "masked",
      "descending",
      "settling",
      "revealing",
      "restoring-focus",
      "idle",
    ]);
    expect(layer.hide).toHaveBeenCalledOnce();
  });

  it("uses a 200ms restrained reduced-motion lifecycle", async () => {
    const { layer } = layerFixture();
    const clock = clockFixture();
    const engine = new WhaleTransitionEngine({
      adapter: { preload: vi.fn(), commit: vi.fn(), focusDestination: vi.fn() },
      layer,
      clock: clock.clock,
      prefersReducedMotion: () => true,
    });

    await engine.navigate({ from: url("/search"), to: url("/documents"), historyAction: "replace" });

    expect(totalWhaleTransitionTime(reducedWhaleTransitionTiming)).toBe(200);
    expect(clock.elapsed()).toBe(200);
    expect(layer.show).toHaveBeenCalledWith(expect.any(String), true);
  });

  it("holds still water for a slow destination and never repeats the breach", async () => {
    const { layer, phases } = layerFixture();
    const clock = clockFixture();
    let releasePreload: (() => void) | undefined;
    const preload = new Promise<void>((resolve) => { releasePreload = resolve; });
    const engine = new WhaleTransitionEngine({
      adapter: { preload: () => preload, commit: vi.fn(), focusDestination: vi.fn() },
      layer,
      clock: clock.clock,
      prefersReducedMotion: () => false,
    });

    const navigation = engine.navigate({ from: url("/start"), to: url("/decide"), historyAction: "push" });
    await vi.waitFor(() => expect(phases).toContain("loading-hold"));
    expect(phases.filter((phase) => phase === "breaching")).toHaveLength(1);
    releasePreload?.();
    await navigation;

    expect(phases.filter((phase) => phase === "breaching")).toHaveLength(1);
    expect(phases.indexOf("loading-hold")).toBeLessThan(phases.indexOf("revealing"));
  });

  it("does not block navigation when transition asset priming fails", async () => {
    const { layer } = layerFixture();
    const clock = clockFixture();
    const errors: string[] = [];
    vi.mocked(layer.prime).mockRejectedValueOnce(new Error("asset unavailable"));
    const commit = vi.fn();
    const engine = new WhaleTransitionEngine({
      adapter: { preload: vi.fn(), commit, focusDestination: vi.fn() },
      layer,
      clock: clock.clock,
      prefersReducedMotion: () => false,
      onError: ({ stage }) => errors.push(stage),
    });

    await engine.navigate({ from: url("/build"), to: url("/release"), historyAction: "push" });
    await Promise.resolve();

    expect(commit).toHaveBeenCalledOnce();
    expect(errors).toContain("asset-preload");
  });

  it("cleans up the overlay and reports a route commit failure", async () => {
    const { layer, phases } = layerFixture();
    const clock = clockFixture();
    const errors: string[] = [];
    const engine = new WhaleTransitionEngine({
      adapter: {
        preload: vi.fn(),
        commit: vi.fn(() => { throw new Error("route failed"); }),
        focusDestination: vi.fn(),
      },
      layer,
      clock: clock.clock,
      prefersReducedMotion: () => false,
      onError: ({ stage }) => errors.push(stage),
    });

    await expect(engine.navigate({ from: url("/start"), to: url("/build"), historyAction: "push" })).rejects.toThrow("route failed");

    expect(errors).toContain("route-commit");
    expect(phases.at(-1)).toBe("idle");
    expect(layer.hide).toHaveBeenCalledOnce();
  });
});
