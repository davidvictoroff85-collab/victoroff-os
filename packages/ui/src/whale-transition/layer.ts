import type { WhaleTransitionLayer, WhaleTransitionPhase, WhaleTransitionVariant } from "./types";

const whaleMarkup =
  '<div class="victoroff-whale-transition__veil"></div>' +
  '<div class="victoroff-whale-transition__whale" data-whale-mark>' +
  '<svg viewBox="0 0 320 160" role="presentation" focusable="false" aria-hidden="true">' +
  '<path d="M24 93c31-5 48-25 67-43 26-25 63-37 101-29 26 5 47 18 67 36 15 13 29 18 44 20-9 11-23 18-41 20-17 28-50 45-91 42-45-3-73-22-91-43-18 6-37 5-56-3Zm66-31c-21 3-38-2-52-14 18-1 34-7 47-17 2 12 4 22 5 31Zm165 37c17 8 32 19 43 34-18 0-35-6-50-18l7-16Z"></path>' +
  '<circle cx="211" cy="56" r="3"></circle>' +
  '</svg></div>' +
  '<div class="victoroff-whale-transition__water" data-whale-water>' +
  '<span></span><span></span><span></span>' +
  '</div>';

export function createWhaleTransitionLayer(document: Document): WhaleTransitionLayer {
  const overlay = document.createElement("div");
  overlay.className = "victoroff-whale-transition";
  overlay.dataset.phase = "idle";
  overlay.dataset.variant = "standard";
  overlay.dataset.reducedMotion = "false";
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("role", "presentation");
  overlay.hidden = true;
  overlay.innerHTML = whaleMarkup;

  const announcer = document.createElement("div");
  announcer.className = "sr-only";
  announcer.dataset.whaleTransitionAnnouncer = "";
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("aria-atomic", "true");

  let mounted = false;
  const mount = () => {
    if (mounted) return;
    const host = document.body ?? document.documentElement;
    host.append(overlay, announcer);
    mounted = true;
  };

  return {
    prime() {
      mount();
    },
    show(variant: WhaleTransitionVariant, reducedMotion: boolean) {
      mount();
      overlay.dataset.phase = "preloading";
      overlay.dataset.variant = variant;
      overlay.dataset.reducedMotion = String(reducedMotion);
      overlay.hidden = false;
      void overlay.offsetWidth;
    },
    setPhase(phase: WhaleTransitionPhase) {
      overlay.dataset.phase = phase;
    },
    announce(message: string) {
      announcer.textContent = "";
      globalThis.setTimeout(() => {
        announcer.textContent = message;
      }, 0);
    },
    hide() {
      overlay.hidden = true;
      overlay.dataset.phase = "idle";
    },
    destroy() {
      overlay.remove();
      announcer.remove();
      mounted = false;
    },
  };
}
