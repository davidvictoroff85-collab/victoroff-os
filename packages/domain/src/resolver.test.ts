import { describe, expect, it } from "vitest";
import { SevenIntentResolver, type IntentSignal } from "./resolver";

describe("SevenIntentResolver", () => {
  const resolver = new SevenIntentResolver();

  it("returns null for no signals", () => {
    const outcome = resolver.resolve([]);
    expect(outcome).toEqual({
      resolvedIntent: null,
      nextAction: null,
      citations: [],
      hasConflict: false,
      hasAmbiguity: false,
    });
  });

  it("resolves a single signal without conflict or ambiguity", () => {
    const signals: IntentSignal[] = [
      { intent: "submit", precedence: "guideline", action: "do_submit", citation: "guide-1" }
    ];
    const outcome = resolver.resolve(signals);
    expect(outcome).toEqual({
      resolvedIntent: "submit",
      nextAction: "do_submit",
      citations: ["guide-1"],
      hasConflict: false,
      hasAmbiguity: false,
    });
  });

  it("honors governance precedence and detects conflicts", () => {
    const signals: IntentSignal[] = [
      { intent: "approve", precedence: "policy", action: "do_approve", citation: "policy-1" },
      { intent: "withdraw", precedence: "custom", action: "do_withdraw", citation: "custom-1" }, // Testing conflict against lower precedence
    ];
    const outcome = resolver.resolve(signals);
    expect(outcome).toEqual({
      resolvedIntent: "approve",
      nextAction: "do_approve",
      citations: ["custom-1", "policy-1"],
      hasConflict: true,
      hasAmbiguity: false,
    });
  });

  it("does not report conflict if lower precedence has same action", () => {
    const signals: IntentSignal[] = [
      { intent: "release", precedence: "statutory", action: "do_release", citation: "stat-1" },
      { intent: "release", precedence: "policy", action: "do_release", citation: "pol-1" },
    ];
    const outcome = resolver.resolve(signals);
    expect(outcome.resolvedIntent).toBe("release");
    expect(outcome.nextAction).toBe("do_release");
    expect(outcome.hasConflict).toBe(false);
    expect(outcome.hasAmbiguity).toBe(false);
  });

  it("handles ambiguity when top precedence signals disagree on action", () => {
    const signals: IntentSignal[] = [
      { intent: "approve", precedence: "statutory", action: "do_approve", citation: "stat-1" },
      { intent: "withdraw", precedence: "statutory", action: "do_withdraw", citation: "stat-2" },
    ];
    const outcome = resolver.resolve(signals);
    expect(outcome).toEqual({
      resolvedIntent: null,
      nextAction: null,
      citations: ["stat-1", "stat-2"],
      hasConflict: false,
      hasAmbiguity: true,
    });
  });

  it("sorts citations deterministically", () => {
    const signals: IntentSignal[] = [
      { intent: "access", precedence: "custom", action: "do_access", citation: "c" },
      { intent: "access", precedence: "custom", action: "do_access", citation: "a" },
      { intent: "access", precedence: "custom", action: "do_access", citation: "b" },
    ];
    const outcome = resolver.resolve(signals);
    expect(outcome.citations).toEqual(["a", "b", "c"]);
  });
});
