import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

const features = [
  {
    icon: '🎤',
    title: 'Voice logging',
    desc: 'Speak your symptoms, meals, and mood. Whisper AI transcribes instantly. No typing required.',
  },
  {
    icon: '🧬',
    title: 'Document intelligence',
    desc: 'Upload Viome, GI-MAP, or doctor reports. Get plain-English summaries and actionable insights.',
  },
  {
    icon: '🍽️',
    title: 'Personalised meal plans',
    desc: 'Weekly plans built around your specific gut profile, test results, and dietary restrictions.',
  },
]

const pricing = [
  {
    name: 'Free',
    price: 0,
    desc: 'Start understanding your gut',
    features: ['3 voice logs', '1 document upload', '7-day history', 'Basic gut score'],
    cta: 'Get started',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Core',
    price: 9,
    desc: 'For daily gut health tracking',
    features: ['Unlimited voice logging', '3 document uploads/mo', 'Weekly AI meal plan', 'Full history + trends'],
    cta: 'Start free trial',
    href: '/auth/signup?plan=core',
    highlight: true,
  },
  {
    name: 'Pro',
    price: 19,
    desc: 'Deep gut intelligence',
    features: ['Everything in Core', 'Unlimited uploads', 'AI gut health coach', 'PDF health reports', 'Email meal plans'],
    cta: 'Go Pro',
    href: '/auth/signup?plan=pro',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-md mx-auto">
        <Image src="/logo.png" alt="gutted." width={100} height={32} className="h-8 w-auto"/>
        <Link href="/auth/login" className="text-white/60 text-sm hover:text-white transition-colors">Log in</Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-5 pt-12 pb-16 max-w-md mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse"/>
          <span className="text-xs text-white/70">AI-powered gut health</span>
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-4">
          <span className="gradient-text">Know your gut.</span>
        </h1>
        <p className="text-white/60 text-lg leading-relaxed mb-10">
          Voice-log your symptoms. Upload your tests. Get a meal plan that actually fits your gut.
        </p>
        <Link href="/auth/signup" className="w-full">
          <Button size="lg" className="w-full text-black font-bold">Start free - no card needed</Button>
        </Link>
        <p className="text-white/30 text-xs mt-3">Free forever. Upgrade when you're ready.</p>
      </section>

      {/* Features */}
      <section className="px-5 pb-16 max-w-md mx-auto space-y-4">
        {features.map(f => (
          <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4">
            <span className="text-3xl flex-shrink-0">{f.icon}</span>
            <div>
              <h3 className="font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="px-5 pb-16 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">How it works</h2>
        <div className="space-y-6">
          {[
            { step: '01', title: 'Tell us about your gut', desc: 'Quick onboarding — your goals, restrictions, and current gut health.' },
            { step: '02', title: 'Log daily', desc: 'Tap the mic. Speak your symptoms, meals, and energy. Takes 30 seconds.' },
            { step: '03', title: 'Upload your tests', desc: 'Snap a photo of any gut health test. AI reads and explains it in plain English.' },
            { step: '04', title: 'Get your meal plan', desc: 'A personalised 7-day plan every week, built around your unique gut profile.' },
          ].map(s => (
            <div key={s.step} className="flex gap-4">
              <span className="gradient-text text-2xl font-bold flex-shrink-0 w-10">{s.step}</span>
              <div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-white/50 text-sm">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-5 pb-20 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">Simple pricing</h2>
        <p className="text-white/50 text-center text-sm mb-8">Start free. No credit card required.</p>
        <div className="space-y-4">
          {pricing.map(plan => (
            <div key={plan.name} className={`rounded-2xl p-5 border ${plan.highlight ? 'border-[#4ADE80]/50 bg-[#4ADE80]/5' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    {plan.highlight && <span className="text-xs bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30 px-2 py-0.5 rounded-full">Popular</span>}
                  </div>
                  <p className="text-white/50 text-sm">{plan.desc}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">{plan.price === 0 ? 'Free' : `$${plan.price}`}</span>
                  {plan.price > 0 && <span className="text-white/40 text-sm">/mo</span>}
                </div>
              </div>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <span className="text-[#4ADE80]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className="block">
                <Button variant={plan.highlight ? 'gradient' : 'outline'} className="w-full">{plan.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-5 py-8 text-center max-w-md mx-auto">
        <Image src="/logo.png" alt="gutted." width={80} height={24} className="h-6 w-auto mx-auto mb-3"/>
        <p className="text-white/30 text-xs">Your gut health data stays private and secure.</p>
      </footer>
    </div>
  )
}
