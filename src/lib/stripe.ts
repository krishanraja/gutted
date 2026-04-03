import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export const PLANS = {
  core: {
    name: 'Core',
    price: 14,
    priceId: 'price_core_monthly', // update after creating in Stripe dashboard
    features: [
      'Unlimited voice logging',
      '5 document uploads/mo',
      'Weekly meal plan + grocery list',
      'AI Gut Coach (10 chats/mo)',
      'Food checker',
      'Enhanced pattern detection',
      'Daily reminders & weekly digest',
    ],
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: 'price_pro_monthly', // update after creating in Stripe dashboard
    features: [
      'Everything in Core',
      'Unlimited document uploads',
      'Unlimited AI Gut Coach',
      'Photo food logging',
      'PDF health reports',
      'Doctor visit summary',
      'Monthly progress reports',
      'Supplement recommendations',
      'Email meal plans',
      'Goal tracking',
    ],
  },
}
