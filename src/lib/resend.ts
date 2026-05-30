import { Resend } from 'resend'
import { lazyClient } from '@/lib/lazy'

// Constructed lazily so importing a route at build time (no env) never throws.
export const resend = lazyClient(() => new Resend(process.env.RESEND_API_KEY))
