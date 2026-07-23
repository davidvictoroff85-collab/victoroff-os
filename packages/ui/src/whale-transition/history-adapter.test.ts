import { describe, expect, it, vi } from "vitest";
import { createHistoryNavigationAdapter } from "./history-adapter";

describe("createHistoryNavigationAdapter", () => {
  it("preserves push, replace, and pop history semantics", async () => {
    const pushState = vi.fn();
    const replaceState = vi.fn();
    const render = vi.fn();
    const focus = vi.fn();
    const fakeWindow = { history: { pushState, replaceState } } as unknown as Window;
    const fakeDocument = { title: "Documents" } as unknown as Document;
    const adapter = createHistoryNavigationAdapter({
      window: fakeWindow,
      document: fakeDocument,
      render,
      focusDestination: focus,
    });
    const destination = new URL("https://victoroff.test/documents");

    await adapter.commit(destination, "push");
    await adapter.commit(destination, "replace");
    await adapter.commit(destination, "pop");
    await adapter.focusDestination();

    expect(pushState).toHaveBeenCalledOnce();
    expect(pushState).toHaveBeenCalledWith(null, "", destination);
    expect(replaceState).toHaveBeenCalledOnce();
    expect(replaceState).toHaveBeenCalledWith(null, "", destination);
    expect(render.mock.calls.map((call) => call[1])).toEqual(["push", "replace", "pop"]);
    expect(focus).toHaveBeenCalledOnce();
    expect(adapter.destinationLabel?.(destination)).toBe("Documents");
  });

  it("focuses the destination landmark without scrolling", async () => {
    const focus = vi.fn();
    const target = {
      tabIndex: 0,
      matches: vi.fn(() => false),
      focus,
    };
    const fakeDocument = {
      title: "People",
      querySelector: vi.fn(() => target),
    } as unknown as Document;
    const fakeWindow = {
      history: { pushState: vi.fn(), replaceState: vi.fn() },
    } as unknown as Window;
    const adapter = createHistoryNavigationAdapter({
      window: fakeWindow,
      document: fakeDocument,
      render: vi.fn(),
    });

    await adapter.focusDestination();

    expect(target.tabIndex).toBe(-1);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });
});
