import { expect, it, vi } from "vitest";
import { WhaleTransitionProvider } from "./provider";
import type { WhaleTransitionLayer } from "./types";

it("primes once at the global boundary and masks popstate without adding history", async () => {
  const listeners = new Map<string, EventListener>();
  const location = { href: "https://victoroff.test/people" };
  const fakeWindow = {
    location,
    matchMedia: vi.fn(() => ({ matches: false })),
    addEventListener: vi.fn((name: string, listener: EventListener) => listeners.set(name, listener)),
    removeEventListener: vi.fn((name: string) => listeners.delete(name)),
  } as unknown as Window;
  const fakeDocument = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as Document;
  const layer: WhaleTransitionLayer = {
    prime: vi.fn(),
    show: vi.fn(),
    setPhase: vi.fn(),
    announce: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn(),
  };
  const commit = vi.fn();
  const provider = new WhaleTransitionProvider({
    window: fakeWindow,
    document: fakeDocument,
    layer,
    adapter: { preload: vi.fn(), commit, focusDestination: vi.fn() },
    clock: { wait: vi.fn(async () => undefined) },
  });

  const stop = provider.start();
  expect(layer.prime).toHaveBeenCalledOnce();
  expect(fakeDocument.addEventListener).toHaveBeenCalledWith("click", expect.any(Function), true);

  location.href = "https://victoroff.test/documents";
  listeners.get("popstate")?.(new Event("popstate"));
  await vi.waitFor(() => expect(commit).toHaveBeenCalled());

  expect(commit).toHaveBeenCalledWith(new URL(location.href), "pop");
  stop();
  expect(layer.destroy).toHaveBeenCalledOnce();
  expect(listeners.has("popstate")).toBe(false);
});
