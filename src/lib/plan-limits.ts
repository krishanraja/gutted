export const PLAN_LIMITS = {
  free: {
    maxLogsPerDay: 3,
    maxUploadsPerMonth: 1,
    historyDays: 7,
    mealPlan: false,
    pdfReports: false,
    emailMealPlans: false,
  },
  core: {
    maxLogsPerDay: Infinity,
    maxUploadsPerMonth: 3,
    historyDays: Infinity,
    mealPlan: true,
    pdfReports: false,
    emailMealPlans: false,
  },
  pro: {
    maxLogsPerDay: Infinity,
    maxUploadsPerMonth: Infinity,
    historyDays: Infinity,
    mealPlan: true,
    pdfReports: true,
    emailMealPlans: true,
  },
} as const

export type PlanName = keyof typeof PLAN_LIMITS

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[(plan as PlanName) || 'free'] || PLAN_LIMITS.free
}
