export const PLAN_LIMITS = {
  free: {
    maxLogsPerDay: 3,
    maxUploadsPerMonth: 1,
    historyDays: 7,
    mealPlan: false,
    pdfReports: false,
    emailMealPlans: false,
    foodChecker: false,
    gutCoach: false,
    gutCoachChatsPerMonth: 0,
    photoLogging: false,
    supplements: false,
    doctorSummary: false,
    groceryList: false,
  },
  core: {
    maxLogsPerDay: Infinity,
    maxUploadsPerMonth: 5,
    historyDays: Infinity,
    mealPlan: true,
    pdfReports: false,
    emailMealPlans: false,
    foodChecker: true,
    gutCoach: true,
    gutCoachChatsPerMonth: 10,
    photoLogging: false,
    supplements: false,
    doctorSummary: false,
    groceryList: true,
  },
  pro: {
    maxLogsPerDay: Infinity,
    maxUploadsPerMonth: Infinity,
    historyDays: Infinity,
    mealPlan: true,
    pdfReports: true,
    emailMealPlans: true,
    foodChecker: true,
    gutCoach: true,
    gutCoachChatsPerMonth: Infinity,
    photoLogging: true,
    supplements: true,
    doctorSummary: true,
    groceryList: true,
  },
} as const

export type PlanName = keyof typeof PLAN_LIMITS

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[(plan as PlanName) || 'free'] || PLAN_LIMITS.free
}
