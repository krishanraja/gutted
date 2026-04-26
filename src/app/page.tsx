import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { HeroVideo } from '@/components/HeroVideo'
import { MicIcon, FileTextIcon, UtensilsIcon, CheckIcon, ArrowRightIcon } from '@/components/icons'

const features = [
  {
    Icon: MicIcon,
    title: 'Voice logging',
    desc: 'Speak your symptoms, meals, and energy levels. Whisper transcribes instantly.',
  },
  {
    Icon: FileTextIcon,
    title: 'Document intelligence',
    desc: 'Upload Viome, GI-MAP, or any gut test. Get plain-English interpretation and a personalised plan.',
  },
  {
    Icon: UtensilsIcon,
    title: 'Personalised meal plans',
    desc: 'AI builds your weekly meal plan from your actual gut profile, not a generic template.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    features: ['3 voice logs / day', '1 document upload', '7-day history', 'Gut score per log'],
    cta: 'Start free',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Core',
    price: '$14',
    period: '/mo',
    features: ['Unlimited voice logging', '5 document uploads / mo', 'Weekly AI meal plan', 'AI Gut Coach (10 chats / mo)', 'Food checker', 'Daily reminders'],
    cta: 'Get Core',
    href: '/auth/signup?plan=core',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    features: ['Everything in Core', 'Unlimited uploads', 'Unlimited AI Gut Coach', 'PDF health reports', 'Doctor visit summary', 'Practitioner share'],
    cta: 'Get Pro',
    href: '/auth/signup?plan=pro',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <>
      <link
        rel="preload"
        as="video"
        href="/gutted-bg.mp4"
        type="video/mp4"
        fetchPriority="high"
      />
      {/* ===== MOBILE: viewport-locked, no scroll ===== */}
      <div className="mobile-viewport md:hidden bg-black text-white">
        <HeroVideo />

        {/* Nav */}
        <nav className="flex-none relative z-20 flex items-center justify-between px-5 pt-safe">
          <div className="flex items-center pt-3">
            <Image src="/icon.png" alt="gutted." width={28} height={28} className="h-7 w-7 drop-shadow-lg" />
          </div>
          <div className="flex gap-2 pt-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Start free</Button>
            </Link>
          </div>
        </nav>

        {/* Hero content - centered */}
        <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 text-center">
          <Image src="/logo.png" alt="gutted." width={240} height={80} className="h-auto w-44 mx-auto drop-shadow-2xl" priority />
          <p className="text-[11px] font-light tracking-[0.32em] uppercase text-white/45 mt-2 mb-5">Know Your Gut</p>
          <p className="text-sm text-white/80 mb-7 leading-relaxed drop-shadow-lg max-w-sm">
            Voice-log your symptoms. Upload your tests. Get a meal plan that actually fits your gut.
          </p>
          <Link href="/auth/signup">
            <Button size="lg">Start free – no card needed</Button>
          </Link>
          <Link href="/auth/login" className="mt-4 text-sm text-white/45 hover:text-white transition-colors">
            Already have an account? <span className="underline">Sign in</span>
          </Link>
        </div>

        {/* Feature hints */}
        <div className="flex-none relative z-10 flex items-center justify-center gap-4 px-6 pb-safe pb-4 text-[11px] text-white/40">
          <span className="inline-flex items-center gap-1.5"><MicIcon size={12} /> Voice</span>
          <span className="text-white/15">·</span>
          <span className="inline-flex items-center gap-1.5"><FileTextIcon size={12} /> Docs</span>
          <span className="text-white/15">·</span>
          <span className="inline-flex items-center gap-1.5"><UtensilsIcon size={12} /> Meals</span>
        </div>
      </div>

      {/* ===== DESKTOP: full scrollable layout ===== */}
      <div className="hidden md:block min-h-screen bg-black text-white">
        {/* Hero with video background */}
        <section className="relative overflow-hidden">
          <HeroVideo />

          <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
            <Image src="/icon.png" alt="gutted." width={32} height={32} className="h-8 w-8 drop-shadow-lg" />
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Start free</Button>
              </Link>
            </div>
          </nav>

          <div className="relative z-10 px-6 py-20 sm:py-28 text-center max-w-2xl mx-auto">
            <Image src="/logo.png" alt="gutted." width={240} height={80} className="h-auto w-56 sm:w-64 mx-auto drop-shadow-2xl" priority />
            <p className="text-sm font-light tracking-[0.32em] uppercase text-white/45 mt-3 mb-8">Know Your Gut</p>
            <p className="text-lg text-white/80 mb-10 leading-relaxed drop-shadow-lg">
              Voice-log your symptoms. Upload your tests. Get a meal plan built from your data, not a template.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/signup">
                <Button size="lg">Start free – no card needed</Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg">See how it works</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="how-it-works" className="px-6 py-20 max-w-5xl mx-auto">
          <h2 className="text-2xl font-medium tracking-tight text-center mb-12">Built for real gut health</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {features.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-6 hover:bg-white/[0.06] hover:border-white/15 transition-all">
                <Icon size={22} className="text-accent mb-4" />
                <h3 className="font-medium text-white mb-2">{title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-20 max-w-5xl mx-auto">
          <h2 className="text-2xl font-medium tracking-tight text-center mb-3">Simple pricing</h2>
          <p className="text-white/55 text-center mb-12">Start free. Upgrade when you see results.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {plans.map(p => (
              <div
                key={p.name}
                className={`rounded-xl p-6 border transition-all ${
                  p.highlight
                    ? 'border-white/15 bg-white/[0.06]'
                    : 'border-white/[0.08] bg-white/[0.04]'
                }`}
              >
                {p.highlight && (
                  <div className="text-[11px] font-medium text-accent mb-3 uppercase tracking-wider">Most popular</div>
                )}
                <p className="font-medium mb-1">{p.name}</p>
                <div className="mb-5">
                  <span className="num text-3xl font-medium tracking-tight">{p.price}</span>
                  <span className="num text-white/45">{p.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/65">
                      <CheckIcon size={14} className="text-[#3FBE6F] shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.href}>
                  <Button variant={p.highlight ? 'gradient' : 'outline'} className="w-full">
                    {p.cta} {p.highlight && <ArrowRightIcon size={14} className="ml-1" />}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/[0.06] text-center text-white/35 text-sm max-w-5xl mx-auto">
          <p>gutted. is not a medical service. Always consult a healthcare professional for medical advice.</p>
          <p className="mt-2">© 2026 gutted.</p>
        </footer>
      </div>
    </>
  )
}
