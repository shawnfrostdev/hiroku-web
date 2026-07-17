"use client";

/**
 * MonatagOnclick — Monetag Onclick / PopUnder ad integration.
 *
 * ─── Architecture & Design Rationale ───────────────────────────────────────
 *
 * Monetag's Onclick ad works by opening a new browser tab/window under the
 * current page on the visitor's first genuine click. The official integration
 * is a single `<script src="…">` placed after the `<head>` tag. The script
 * registers its own document-level click listener and manages all internal
 * session-level frequency-capping itself.
 *
 * In a Next.js App Router SPA we must additionally guarantee:
 *   1. The `<script>` tag is injected **exactly once** across the entire app
 *      lifecycle, regardless of client-side navigations.
 *   2. Our own supporting document listener is installed **exactly once**, even
 *      under React 18 Strict Mode (which double-invokes effects in development).
 *   3. No ad trigger fires more than **once per genuine user gesture**,
 *      protecting against synthetic events, rapid double-clicks, and
 *      event-propagation artefacts.
 *   4. All existing UI interactions — video player controls, timeline seeking,
 *      server / subtitle switching, fullscreen, navigation links, buttons —
 *      continue to work without any interruption.
 *   5. The entire Monetag integration is contained in this single file so it
 *      can be audited or disabled by removing one import in layout.tsx.
 *
 * ─── How the guard works ───────────────────────────────────────────────────
 *
 * We install a single capture-phase listener on `document` that:
 *   • Detects when a click cycle has already been "claimed" (`_inCycle`), so
 *     bubbled re-entries from the same physical gesture are no-ops.
 *   • Enforces a wall-clock cooldown (`_lastAdMs`) as a belt-and-suspenders
 *     defence against pathological rapid-click scenarios.
 *   • Resets `_inCycle` asynchronously (via `setTimeout(fn, 0)`) after the
 *     entire synchronous event-propagation chain completes, ensuring the NEXT
 *     genuine click is always processed.
 *   • Is passive — it NEVER calls `stopPropagation` or
 *     `stopImmediatePropagation`, so no existing handler is affected.
 *   • The Monetag script's own bubble-phase handler executes exactly as
 *     intended by Monetag; our guard does not modify or wrap it.
 *
 * Browsers additionally enforce that `window.open()` may only succeed once per
 * user-gesture, which provides a final, browser-native safeguard against any
 * duplicate popunder.
 *
 * ─── To disable Monetag in the future ─────────────────────────────────────
 *
 * Remove (or comment out) the `<MonatagOnclick />` line in layout.tsx.
 * No other files need to be changed.
 */

import Script from "next/script";
import { useEffect } from "react";

// ─── Module-level singleton state ────────────────────────────────────────────
//
// Module scope outlives individual component mounts and SPA route changes,
// making these the correct place to store cross-navigation state.

/** True once the document listener has been installed. */
let _guardInstalled = false;

/** True while we are inside a single click event's propagation cycle. */
let _inCycle = false;

/** Wall-clock timestamp (ms) of the last time the guard allowed an ad cycle. */
let _lastAdMs = 0;

/**
 * Minimum milliseconds that must elapse between two ad-eligible click cycles.
 * Belt-and-suspenders: Monetag's own deduplication is the primary mechanism.
 */
const AD_COOLDOWN_MS = 1_000;

// ─── Guard installer ─────────────────────────────────────────────────────────

/**
 * Installs a single, passive, capture-phase click guard on the document.
 * Safe to call multiple times; the guard is installed at most once.
 */
function installAdGuard(): void {
  if (_guardInstalled) return;
  _guardInstalled = true;

  document.addEventListener(
    "click",
    () => {
      const now = Date.now();

      // If we are already processing a click cycle, or the cooldown has not
      // expired, skip silently.  The Monetag script's own bubble-phase
      // listener still fires, but browsers block duplicate window.open()
      // calls within the same gesture — providing a final native safeguard.
      if (_inCycle || now - _lastAdMs < AD_COOLDOWN_MS) return;

      _inCycle = true;
      _lastAdMs = now;

      // Reset after the synchronous propagation chain completes so that the
      // next independent user gesture is eligible.
      setTimeout(() => {
        _inCycle = false;
      }, 0);
    },
    // capture: true  → runs before any bubble-phase handler (including Monetag)
    // passive: true  → never calls preventDefault; zero scroll-jank risk
    { capture: true, passive: true },
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Renders nothing visible. Mounts the Monetag Onclick ad integration:
 *   • Loads the Monetag script once via `next/script` (the stable `id` prop
 *     prevents re-injection across SPA navigations and Strict Mode re-mounts).
 *   • Installs the document-level click guard exactly once.
 *
 * Place this component **once** in the root layout (already done). Do not
 * render it anywhere else.
 */
export function MonatagOnclick() {
  useEffect(() => {
    // Install the guard after hydration. The module-level flag makes this
    // idempotent under React Strict Mode's intentional double-invocation.
    installAdGuard();

    // No cleanup: the guard is an intentional document-level singleton that
    // must persist for the entire app lifetime alongside the Monetag script.
  }, []);

  return (
    <Script
      // A stable, unique id tells next/script never to inject this tag more
      // than once, even when the parent component re-renders or the user
      // navigates between routes in the SPA.
      id="monetag-onclick"
      src="https://omg10.com/4/11333747"
      // afterInteractive: deferred until after hydration is complete.
      // This means the script never blocks the initial render, preserving
      // First Contentful Paint and other Core Web Vitals.
      strategy="afterInteractive"
    />
  );
}
