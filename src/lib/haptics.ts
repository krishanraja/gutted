export const haptic = {
  // Core intensities
  tap: () => { try { navigator.vibrate?.(5) } catch {} },
  light: () => { try { navigator.vibrate?.(10) } catch {} },
  medium: () => { try { navigator.vibrate?.(25) } catch {} },
  heavy: () => { try { navigator.vibrate?.(50) } catch {} },
  // Gesture feedback
  swipe: () => { try { navigator.vibrate?.(8) } catch {} },
  // Patterns
  success: () => { try { navigator.vibrate?.([10, 50, 20]) } catch {} },
  error: () => { try { navigator.vibrate?.([50, 30, 50, 30, 50]) } catch {} },
  warning: () => { try { navigator.vibrate?.([30, 50, 30]) } catch {} },
  double: () => { try { navigator.vibrate?.([8, 40, 8]) } catch {} },
  refresh: () => { try { navigator.vibrate?.([10, 20, 30]) } catch {} },
  scoreReveal: () => { try { navigator.vibrate?.([5, 30, 10, 30, 15, 30, 25]) } catch {} },

  // === EXPANDED VOCABULARY (additive) ===
  // Each pattern carries a distinct emotional shape so feedback reads by feel
  // alone, without looking at the screen. Two short buzzes that grow = "up",
  // two that shrink = "down"; quick crescendos = "good", a flat thud = "neutral".

  /** A clean rising double-tick. Use for the satisfying "this went up / you
   *  earned it" moment (streak gained, score improved, item completed). The
   *  ascending intensity makes it feel like lift. */
  up: () => { try { navigator.vibrate?.([8, 28, 18, 28, 32]) } catch {} },

  /** A descending settle. Use for a soft downward change (score dipped, item
   *  removed) without it feeling like an error. Falling intensity = a sigh. */
  down: () => { try { navigator.vibrate?.([26, 30, 14, 30, 7]) } catch {} },

  /** A flat, single, weight-free pulse. The "nothing special happened, but I
   *  heard you" acknowledgement for neutral state changes (toggle, dismiss). */
  neutral: () => { try { navigator.vibrate?.(14) } catch {} },

  /** A barely-there selection tick, lighter than tap. For scrubbing through a
   *  picker, day strip, or segmented control where each step should register. */
  selection: () => { try { navigator.vibrate?.(4) } catch {} },

  /** A two-stage "soft land" for confirmations: a small impact then a fuller
   *  one, like an object setting down. Use when a press lands / commits. */
  confirm: () => { try { navigator.vibrate?.([12, 24, 28]) } catch {} },

  /** A rich, celebratory burst for genuine wins (goal hit, plan generated,
   *  milestone). More texture than success, but still warm not jarring. */
  celebrate: () => { try { navigator.vibrate?.([10, 30, 18, 30, 26, 30, 40]) } catch {} },

  /** A gentle, low pull to draw attention without alarm (nudge, hint, reveal of
   *  new content). Single longer-but-soft buzz reads as "look here". */
  nudge: () => { try { navigator.vibrate?.([18, 60, 18]) } catch {} },

  /** A crisp boundary tick for "you can't / end of the line" (swipe past the
   *  last card, hit a limit). Sharp and short so it reads as a wall. */
  bump: () => { try { navigator.vibrate?.([6, 18, 6]) } catch {} },

  /** A long, steady ramp tied to a loading/processing start, so a wait feels
   *  acknowledged. Pairs with skeleton shimmer entrances. */
  longPress: () => { try { navigator.vibrate?.([0, 40, 12, 40]) } catch {} },
}

/** Cancel any in-flight vibration pattern. Useful when a gesture is aborted
 *  mid-pattern (e.g. a swipe snaps back). No-op where unsupported. */
export function cancelHaptic() {
  try { navigator.vibrate?.(0) } catch {}
}
