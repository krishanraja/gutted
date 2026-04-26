'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/components/AuthProvider'

const steps = [
  {
    q: "What are your gut health goals?",
    subtitle: "Select all that apply - we'll personalise your experience.",
    key: 'goals',
    multi: true,
    options: [
      { value: 'Reduce bloating', icon: '🫧', desc: 'Less bloating and gas' },
      { value: 'Improve digestion', icon: '🔄', desc: 'Better digestive flow' },
      { value: 'Understand my test results', icon: '📋', desc: 'Make sense of lab work' },
      { value: 'Lose weight', icon: '⚖️', desc: 'Weight management support' },
      { value: 'Increase energy', icon: '⚡', desc: 'Feel more energised' },
      { value: 'Better sleep', icon: '😴', desc: 'Improve sleep quality' },
    ],
  },
  {
    q: "Any dietary restrictions?",
    subtitle: "We'll tailor meal plans and food suggestions for you.",
    key: 'restrictions',
    multi: true,
    options: [
      { value: 'Gluten-free', icon: '🌾', desc: 'No wheat or gluten' },
      { value: 'Dairy-free', icon: '🥛', desc: 'No milk products' },
      { value: 'Vegan', icon: '🌱', desc: 'Plant-based only' },
      { value: 'Vegetarian', icon: '🥬', desc: 'No meat' },
      { value: 'Low-FODMAP', icon: '🧪', desc: 'Fermentable carb reduction' },
      { value: 'Keto', icon: '🥑', desc: 'High fat, low carb' },
      { value: 'None', icon: '✅', desc: 'No restrictions' },
    ],
  },
  {
    q: "Any diagnosed conditions?",
    subtitle: "This helps us provide more relevant insights. Completely optional.",
    key: 'conditions',
    multi: true,
    options: [
      { value: 'IBS', icon: '🩺', desc: 'Irritable bowel syndrome' },
      { value: 'SIBO', icon: '🦠', desc: 'Small intestinal bacterial overgrowth' },
      { value: "Crohn's", icon: '🏥', desc: "Crohn's disease" },
      { value: 'Colitis', icon: '🏥', desc: 'Ulcerative colitis' },
      { value: 'Celiac', icon: '🌾', desc: 'Celiac disease' },
      { value: 'GERD', icon: '🔥', desc: 'Acid reflux / GERD' },
      { value: 'None', icon: '✅', desc: 'No diagnosed conditions' },
      { value: 'Prefer not to say', icon: '🤐', desc: 'Keep private' },
    ],
  },
]

type Phase = 'questions' | 'gut-score' | 'summary' | 'saving'

export default function OnboardingPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [gutScore, setGutScore] = useState(5)
  const [phase, setPhase] = useState<Phase>('questions')
  const [saving, setSaving] = useState(false)

  const totalSteps = steps.length + 2 // +1 gut score, +1 summary
  const currentProgress = phase === 'questions' ? step : phase === 'gut-score' ? steps.length : steps.length + 1
  const progress = (currentProgress / totalSteps) * 100

  const toggle = (key: string, val: string) => {
    setAnswers(prev => {
      const arr = prev[key] || []
      return { ...prev, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] }
    })
  }

  const handleNext = () => {
    if (phase === 'questions' && step < steps.length - 1) {
      setStep(s => s + 1)
    } else if (phase === 'questions') {
      setPhase('gut-score')
    } else if (phase === 'gut-score') {
      setPhase('summary')
    }
  }

  const handleBack = () => {
    if (phase === 'summary') {
      setPhase('gut-score')
    } else if (phase === 'gut-score') {
      setPhase('questions')
      setStep(steps.length - 1)
    } else if (step > 0) {
      setStep(s => s - 1)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setPhase('saving')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    await supabase.from('profiles').update({
      gut_profile: { ...answers, currentGutScore: gutScore },
      onboarding_complete: true,
    }).eq('id', user.id)

    await refresh()

    const selectedPlan = sessionStorage.getItem('gutted-selected-plan')
    if (selectedPlan === 'core' || selectedPlan === 'pro') {
      sessionStorage.removeItem('gutted-selected-plan')
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: selectedPlan }),
        })
        const { url } = await res.json()
        if (url) { window.location.href = url; return }
      } catch {
        // Checkout failed -- fall through to dashboard
      }
    }

    router.push('/dashboard')
  }

  const currentStep = steps[step]
  const stepLabel = phase === 'questions'
    ? `Step ${step + 1} of ${totalSteps}`
    : phase === 'gut-score'
    ? `Step ${steps.length + 1} of ${totalSteps}`
    : `Step ${totalSteps} of ${totalSteps}`

  const scoreColor = gutScore >= 7 ? '#3FBE6F' : gutScore >= 4 ? '#E8AE1E' : '#E96363'

  return (
    <div className="mobile-viewport bg-black px-5 md:px-6 md:static md:min-h-screen md:flex md:flex-col">
      <div className="pt-safe flex justify-center">
        <Image src="/icon.png" alt="gutted." width={28} height={28} className="h-7 w-7 mt-3" />
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mx-auto mb-6 mt-5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="num text-white/35 text-[11px] uppercase tracking-wider">{stepLabel}</p>
          <p className="num text-white/35 text-[11px]">{Math.round(progress)}%</p>
        </div>
        <div className="w-full bg-white/[0.06] rounded-full h-1">
          <div
            className="h-1 rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full overflow-y-auto min-h-0">
        {(step > 0 || phase !== 'questions') && phase !== 'saving' && (
          <button onClick={handleBack} className="text-white/45 text-sm mb-3 inline-flex items-center gap-1 self-start hover:text-white transition-colors">
            <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
        )}

        {/* Question steps */}
        {phase === 'questions' && (
          <div className="animate-fade-in">
            <h2 className="text-xl md:text-2xl font-medium tracking-tight mb-2">{currentStep.q}</h2>
            <p className="text-white/50 text-sm mb-6">{currentStep.subtitle}</p>
            <div className="grid grid-cols-2 gap-2">
              {currentStep.options.map(opt => {
                const selected = (answers[currentStep.key] || []).includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggle(currentStep.key, opt.value)}
                    className={`p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                      selected
                        ? 'border-accent bg-accent/[0.08]'
                        : 'border-white/[0.08] bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="text-lg mb-2 opacity-80">{opt.icon}</div>
                    <p className={`text-sm font-medium mb-0.5 ${selected ? 'text-white' : 'text-white/80'}`}>
                      {opt.value}
                    </p>
                    <p className="text-[11px] text-white/40">{opt.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Gut score step */}
        {phase === 'gut-score' && (
          <div className="animate-fade-in">
            <h2 className="text-xl md:text-2xl font-medium tracking-tight mb-2">How is your gut right now?</h2>
            <p className="text-white/50 text-sm mb-10">Be honest. This is your starting point, not your goal.</p>
            <div className="flex flex-col items-center gap-8">
              <div className="relative flex flex-col items-center">
                <div className="num text-6xl md:text-7xl font-semibold tracking-tight" style={{ color: scoreColor }}>{gutScore}</div>
                <p className="num text-white/35 text-sm text-center mt-1">/ 10</p>
              </div>
              <div className="w-full">
                <input
                  type="range" min={1} max={10} value={gutScore}
                  onChange={e => setGutScore(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between w-full text-white/35 text-xs mt-2">
                  <span>Rough</span><span>Okay</span><span>Great</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary step */}
        {phase === 'summary' && (
          <div className="animate-fade-in">
            <h2 className="text-xl md:text-2xl font-medium tracking-tight mb-2">Here&apos;s your gut profile</h2>
            <p className="text-white/50 text-sm mb-6">Looks good? You can always update this later in settings.</p>

            <div className="space-y-3">
              <Card>
                <p className="text-white/45 text-[11px] uppercase tracking-wider mb-2">Current gut score</p>
                <p className="num text-3xl font-semibold tracking-tight" style={{ color: scoreColor }}>
                  {gutScore}<span className="text-lg text-white/35"> / 10</span>
                </p>
              </Card>

              {answers.goals?.length > 0 && (
                <Card>
                  <p className="text-white/45 text-[11px] uppercase tracking-wider mb-2">Goals</p>
                  <div className="flex flex-wrap gap-1.5">
                    {answers.goals.map(g => (
                      <span key={g} className="px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-xs text-white/85">{g}</span>
                    ))}
                  </div>
                </Card>
              )}

              {answers.restrictions?.length > 0 && (
                <Card>
                  <p className="text-white/45 text-[11px] uppercase tracking-wider mb-2">Dietary restrictions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {answers.restrictions.map(r => (
                      <span key={r} className="px-2.5 py-1 rounded-md bg-white/[0.06] text-xs text-white/75">{r}</span>
                    ))}
                  </div>
                </Card>
              )}

              {answers.conditions?.length > 0 && (
                <Card>
                  <p className="text-white/45 text-[11px] uppercase tracking-wider mb-2">Conditions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {answers.conditions.map(c => (
                      <span key={c} className="px-2.5 py-1 rounded-md bg-white/[0.06] text-xs text-white/75">{c}</span>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Saving state */}
        {phase === 'saving' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
            <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4"/>
            <p className="text-white/75 font-medium">Building your gut profile…</p>
            <p className="text-white/35 text-sm mt-1">This only takes a moment.</p>
          </div>
        )}
      </div>

      {phase !== 'saving' && (
        <div className="pt-4 pb-safe max-w-md mx-auto w-full space-y-2 shrink-0">
          {phase === 'summary' ? (
            <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
              Let&apos;s go
            </Button>
          ) : (
            <Button onClick={handleNext} className="w-full" size="lg">
              Continue
            </Button>
          )}
          {phase === 'questions' && (
            <button onClick={handleNext} className="w-full text-center text-white/35 text-sm hover:text-white/55 transition-colors">
              Skip for now
            </button>
          )}
        </div>
      )}
    </div>
  )
}
