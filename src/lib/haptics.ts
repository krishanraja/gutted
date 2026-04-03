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
}
