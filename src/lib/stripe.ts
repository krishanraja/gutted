import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

export const PLANS = {
  core: {
    name: 'Core',
    price: 9,
    priceId: 'price_core_monthly', // update after creating in Stripe dashboard
    features: ['Unlimited voice logging', '3 document uploads/mo', 'Weekly meal plan', 'AI gut coach'],
  },
  pro: {
    name: 'Pro',
    price: 19,
    priceId: 'price_pro_monthly', // update after creating in Stripe dashboard
    features: ['Everything in Core', 'Unlimited document uploads', 'PDF health reports', 'Priority AI analysis', 'Email meal plans'],
  },
}
