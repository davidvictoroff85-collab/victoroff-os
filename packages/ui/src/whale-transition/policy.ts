import { whaleTransitionVariants, type WhaleTransitionVariant } from "./types";

export interface NavigationCandidate {
  currentUrl: URL;
  destinationUrl: URL;
  button?: number;
  defaultPrevented?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  download?: boolean;
  target?: string;
  rel?: string;
}

export function qualifiesForWhaleTransition(candidate: NavigationCandidate): boolean {
  if (candidate.defaultPrevented) return false;
  if ((candidate.button ?? 0) !== 0) return false;
  if (candidate.altKey || candidate.ctrlKey || candidate.metaKey || candidate.shiftKey) return false;
  if (candidate.download) return false;
  if (candidate.target && candidate.target.toLowerCase() !== "_self") return false;
  if (candidate.rel?.split(/\s+/).some((token) => token.toLowerCase() === "external")) return false;

  const { currentUrl, destinationUrl } = candidate;
  if (!(["http:", "https:"].includes(destinationUrl.protocol))) return false;
  if (currentUrl.origin !== destinationUrl.origin) return false;

  const currentSpace = currentUrl.pathname + currentUrl.search;
  const destinationSpace = destinationUrl.pathname + destinationUrl.search;
  if (currentSpace === destinationSpace) return false;

  return true;
}

function routeHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function selectWhaleTransitionVariant(from: URL, to: URL): WhaleTransitionVariant {
  const routeKey = from.pathname + from.search + "→" + to.pathname + to.search;
  return whaleTransitionVariants[routeHash(routeKey) % whaleTransitionVariants.length] ?? "standard";
}
