export const haptic = {
  light: () => { try { navigator.vibrate?.(10) } catch {} },
  medium: () => { try { navigator.vibrate?.(25) } catch {} },
  heavy: () => { try { navigator.vibrate?.(50) } catch {} },
  success: () => { try { navigator.vibrate?.([10, 50, 20]) } catch {} },
  error: () => { try { navigator.vibrate?.([50, 30, 50, 30, 50]) } catch {} },
}
