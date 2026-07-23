export type SevenIntent = "access" | "draft" | "submit" | "review" | "approve" | "release" | "withdraw";

export type GovernancePrecedence = "statutory" | "policy" | "guideline" | "custom";

export interface IntentSignal {
  intent: SevenIntent;
  precedence: GovernancePrecedence;
  action: string;
  citation: string;
}

export interface ResolverOutcome {
  resolvedIntent: SevenIntent | null;
  nextAction: string | null;
  citations: string[];
  hasConflict: boolean;
  hasAmbiguity: boolean;
}

const precedenceRank: Record<GovernancePrecedence, number> = {
  statutory: 4,
  policy: 3,
  guideline: 2,
  custom: 1,
};

export class SevenIntentResolver {
  resolve(signals: IntentSignal[]): ResolverOutcome {
    if (signals.length === 0) {
      return {
        resolvedIntent: null,
        nextAction: null,
        citations: [],
        hasConflict: false,
        hasAmbiguity: false,
      };
    }

    const maxRank = Math.max(...signals.map((s) => precedenceRank[s.precedence]));
    const topSignals = signals.filter((s) => precedenceRank[s.precedence] === maxRank);

    // If topSignals is empty (should not happen with Math.max), default safely
    const topAction = topSignals[0]?.action;
    const topIntent = topSignals[0]?.intent;

    const hasConflict = topAction !== undefined ? signals.some((s) => precedenceRank[s.precedence] < maxRank && s.action !== topAction) : false;
    const uniqueActions = new Set(topSignals.map((s) => s.action));
    const hasAmbiguity = uniqueActions.size > 1;

    return {
      resolvedIntent: hasAmbiguity || topIntent === undefined ? null : topIntent,
      nextAction: hasAmbiguity || topAction === undefined ? null : topAction,
      citations: signals.map((s) => s.citation).sort(),
      hasConflict,
      hasAmbiguity,
    };
  }
}
