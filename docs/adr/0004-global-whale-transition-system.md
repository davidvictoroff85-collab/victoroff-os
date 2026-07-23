# ADR 0004: Global Whale Transition System

Status: proposed

## Context

Meaningful movement between Victoroff interface spaces should feel coherent without exposing
governance machinery or turning ordinary interaction into spectacle. The current public site has
only same-page anchors, and apps/os does not yet exist, so there is no qualifying routed navigation
to animate today. Implementing a separate clip on each page would create inconsistent behavior and
would break the singular action-first experience.

## Decision

Every meaningful internal movement between Victoroff interface spaces shall pass through one Global
Whale Transition System. Individual pages shall not implement, override, or duplicate navigation
transition behavior.

The internal application router shall be wrapped once by WhaleTransitionProvider. The provider owns
navigation qualification, destination preloading, transition state, centrally selected variants,
route commitment, destination reveal, history behavior, focus restoration, route announcements, and
reduced-motion behavior.

The provider uses this state machine:

1. Accept a navigation intent and determine whether it is a qualifying same-origin route change.
2. Begin destination loading and raise a restrained water surface from the viewport bottom.
3. Animate the whale breach while the destination continues loading.
4. Commit the route at the visual mask, preserving the router's native history operation.
5. Render the destination beneath the overlay.
6. Descend the whale and settle the water. If the destination is not ready, hold a still settled-
   water state; never loop the breach as a loading spinner.
7. Dissolve the overlay, restore focus to the destination landmark, and announce the new route.

Normal motion targets 800–900 milliseconds and must remain within 700–1000 milliseconds. Reduced
motion keeps the same navigation and focus architecture but substitutes a 150–250 millisecond
water-line and opacity transition.

The controlled variant set is standard, left-to-right, right-to-left, distant, close, and tail
descent. A central deterministic policy selects a variant from route context; pages cannot request
arbitrary animation. The visual language remains institutional, cinematic, restrained, premium,
and timeless rather than cartoonish, playful, childish, noisy, game-like, or prolonged.

The full transition does not qualify for external navigation, same-page anchors, modified clicks,
downloads, new-window targets, typing, dropdowns, accordions, modal opening, controls, filters, or
minor local state changes. Back and forward navigation uses the same transition without creating a
new history entry. Deep links remain native router and server concerns.

The overlay is fixed and dimensionally stable, uses transforms and opacity, is hidden from the
accessibility tree, and never traps focus. Critical whale assets are preloaded opportunistically,
but route loading and navigation never wait for animation downloads. A non-animated fallback must
remain available when assets fail.

## Consequences

- Navigation behavior has one owner and one test surface.
- Route loading begins immediately and the animation masks work instead of delaying it.
- Keyboard navigation, screen readers, focus, history, deep links, and back/forward behavior remain
  native and verifiable.
- The public site's current same-page anchors remain immediate.
- Code implementation waits for an owned internal-router packet; this ADR does not authorize
  production deployment, real institutional data, expanded permission, or constitutional authority.

## Verification contract

The implementation predicate must cover qualifying and excluded intents, all six controlled
variants, 700–1000 millisecond normal timing, 150–250 millisecond reduced motion, concurrent preload,
route commit at mask, loading hold without looping, history/popstate behavior, destination focus,
route announcement, asset failure, and the prohibition on page-owned transition code.
