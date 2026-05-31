export interface UnlockState {
  unlocked: boolean
  requirement: string
  cta: string
  ctaTab: string
}

export interface UnlockStatus {
  overview: UnlockState
  log: UnlockState
  history: UnlockState
  coach: UnlockState
  meals: UnlockState
  upload: UnlockState
  check: UnlockState
  supplements: UnlockState
}

export function getUnlockStatus(
  logCount: number,
  docCount: number,
  hasRestrictions: boolean,
  planLimits?: { gutCoach?: boolean; foodChecker?: boolean; supplements?: boolean; mealPlan?: boolean },
): UnlockStatus {
  // Paid plans unlock the features they include immediately. Free users keep the
  // usage-based progressive unlock, which also surfaces the upgrade prompt.
  const p = planLimits || {}
  return {
    log: {
      unlocked: true,
      requirement: '',
      cta: '',
      ctaTab: '',
    },
    overview: {
      unlocked: logCount >= 1,
      requirement: 'Log your first entry to see your gut score',
      cta: 'Log now',
      ctaTab: 'log',
    },
    history: {
      unlocked: logCount >= 3,
      requirement: `Log ${Math.max(0, 3 - logCount)} more ${3 - logCount === 1 ? 'entry' : 'entries'} to unlock History`,
      cta: 'Log now',
      ctaTab: 'log',
    },
    coach: {
      unlocked: !!p.gutCoach || logCount >= 5,
      requirement: `Log ${Math.max(0, 5 - logCount)} more ${5 - logCount === 1 ? 'entry' : 'entries'} to unlock Coach`,
      cta: 'Log now',
      ctaTab: 'log',
    },
    meals: {
      unlocked: !!p.mealPlan || hasRestrictions,
      requirement: 'Set your dietary restrictions to unlock Meals',
      cta: 'Update profile',
      ctaTab: 'overview',
    },
    upload: {
      unlocked: true,
      requirement: '',
      cta: '',
      ctaTab: '',
    },
    check: {
      unlocked: !!p.foodChecker || logCount >= 1,
      requirement: 'Log your first entry to unlock Food Check',
      cta: 'Log now',
      ctaTab: 'log',
    },
    supplements: {
      unlocked: !!p.supplements || docCount >= 1,
      requirement: 'Upload a gut test to unlock Supplements',
      cta: 'Upload now',
      ctaTab: 'upload',
    },
  }
}
