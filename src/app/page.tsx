import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

const features = [
  {
    emoji: '🎤',
    title: 'Voice logging',
    desc: 'Speak your symptoms, meals, and energy levels. Whisper AI transcribes instantly.',
  },
  {
    emoji: '🧬',
    title: 'Document intelligence',
    desc: 'Upload Viome, GI-MAP, or any gut test. Get plain-English interpretation and a personalised plan.',
  },
  {
    emoji: '🍽️',
    title: 'Personalised meal plans',
    desc: 'AI builds your weekly meal plan based on your actual gut profile - not generic advice.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    features: ['3 voice logs', '1 document upload', '7-day history', 'Basic gut score'],
    cta: 'Start free',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Core',
    price: '$9',
    period: '/mo',
    features: ['Unlimited voice logging', '3 document uploads/mo', 'Weekly AI meal plan', 'Gut health trends'],
    cta: 'Get Core',
    href: '/auth/signup?plan=core',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/mo',
    features: ['Everything in Core', 'Unlimited uploads', 'PDF health reports', 'Priority AI analysis', 'Weekly email meal plans'],
    cta: 'Get Pro',
    href: '/auth/signup?plan=pro',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero with video background */}
      <section className="relative overflow-hidden">
        {/* Video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/Gutted background.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Nav overlaying video */}
        <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
          <Image src="/icon.png" alt="gutted." width={32} height={32} className="h-8 w-8 drop-shadow-lg" />
          <div className="flex gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Start free</Button>
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 px-6 py-16 sm:py-24 text-center max-w-2xl mx-auto">
          <div className="mb-1">
            <Image src="/logo.png" alt="gutted." width={240} height={80} className="h-auto w-60 sm:w-72 mx-auto drop-shadow-2xl" priority />
          </div>
          <p className="text-sm sm:text-base font-light tracking-[0.25em] uppercase text-white/50 mb-10">Know Your Gut</p>
          <p className="text-lg text-white/80 mb-10 leading-relaxed drop-shadow-lg">
            Voice-log your symptoms. Upload your tests. Get a meal plan that actually fits your gut - not a generic one-size-fits-all template.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup">
              <Button size="lg">Start free - no card needed</Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg">See how it works</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12 gradient-text">Built for real gut health</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#00B4B4]/30 transition-colors">
              <div className="text-3xl mb-4">{f.emoji}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-white/50 text-center mb-12">Start free. Upgrade when you see results.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {plans.map(p => (
            <div key={p.name} className={`rounded-2xl p-6 border transition-all ${p.highlight ? 'border-[#00B4B4] bg-[#00B4B4]/5 shadow-lg shadow-[#00B4B4]/10' : 'border-white/10 bg-white/5'}`}>
              {p.highlight && (
                <div className="text-xs font-semibold text-[#4ADE80] mb-3 uppercase tracking-wide">Most popular</div>
              )}
              <div className="mb-4">
                <span className="text-3xl font-bold">{p.price}</span>
                <span className="text-white/40">{p.period}</span>
              </div>
              <p className="font-semibold mb-4">{p.name}</p>
              <ul className="space-y-2 mb-6">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                    <span className="text-[#4ADE80]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href={p.href}>
                <Button variant={p.highlight ? 'gradient' : 'outline'} className="w-full">{p.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/10 text-center text-white/30 text-sm max-w-4xl mx-auto">
        <p>gutted. is not a medical service. Always consult a healthcare professional for medical advice.</p>
        <p className="mt-2">© 2026 gutted. All rights reserved.</p>
      </footer>
    </div>
  )
}
