'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

const steps = [
  {
    q: "What are your gut health goals?",
    key: 'goals',
    multi: true,
    options: ['Reduce bloating', 'Improve digestion', 'Understand my test results', 'Lose weight', 'Increase energy', 'Better sleep'],
  },
  {
    q: "Any dietary restrictions?",
    key: 'restrictions',
    multi: true,
    options: ['Gluten-free', 'Dairy-free', 'Vegan', 'Vegetarian', 'Low-FODMAP', 'Keto', 'None'],
  },
  {
    q: "Any diagnosed conditions?",
    key: 'conditions',
    multi: true,
    options: ['IBS', 'SIBO', "Crohn's", 'Colitis', 'Celiac', 'GERD', 'None', 'Prefer not to say'],
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [gutScore, setGutScore] = useState(5)
  const [saving, setSaving] = useState(false)

  const totalSteps = steps.length + 1 // +1 for gut score step
  const progress = ((step) / totalSteps) * 100

  const toggle = (key: string, val: string) => {
    setAnswers(prev => {
      const arr = prev[key] || []
      return { ...prev, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] }
    })
  }

  const isLastStep = step === steps.length
  const currentStep = steps[step]

  const next = async () => {
    if (!isLastStep) { setStep(s => s + 1); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    await supabase.from('profiles').update({
      gut_profile: { ...answers, currentGutScore: gutScore },
      onboarding_complete: true,
    }).eq('id', user.id)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col px-6">
      <div className="pt-8 pb-4 flex justify-center">
        <Image src="/icon.png" alt="gutted." width={32} height={32} className="h-8 w-8" />
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/10 rounded-full h-1 mb-8 max-w-sm mx-auto">
        <div
          className="h-1 rounded-full bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="text-white/40 text-sm mb-3 flex items-center gap-1 self-start">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
        )}
        <p className="text-white/40 text-sm mb-2">Step {step + 1} of {totalSteps}</p>

        {!isLastStep ? (
          <>
            <h2 className="text-2xl font-bold mb-8">{currentStep.q}</h2>
            <div className="flex flex-wrap gap-3 flex-1">
              {currentStep.options.map(opt => {
                const selected = (answers[currentStep.key] || []).includes(opt)
                return (
                  <button
                    key={opt}
                    onClick={() => toggle(currentStep.key, opt)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      selected
                        ? 'border-[#00B4B4] bg-[#00B4B4]/20 text-[#4ADE80]'
                        : 'border-white/20 text-white/60 hover:border-white/40'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">How is your gut health right now?</h2>
            <p className="text-white/40 text-sm mb-10">Rate from 1 (rough) to 10 (great)</p>
            <div className="flex flex-col items-center gap-6">
              <div className="text-6xl font-bold gradient-text">{gutScore}</div>
              <input
                type="range" min={1} max={10} value={gutScore}
                onChange={e => setGutScore(Number(e.target.value))}
                className="w-full accent-[#00B4B4]"
              />
              <div className="flex justify-between w-full text-white/30 text-xs">
                <span>Rough</span><span>Great</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="pb-8 pt-4 max-w-sm mx-auto w-full space-y-3">
        <Button onClick={next} loading={saving} className="w-full" size="lg">
          {isLastStep ? 'Build my gut profile' : 'Continue'}
        </Button>
        {!isLastStep && (
          <button onClick={() => setStep(s => s + 1)} className="w-full text-center text-white/30 text-sm hover:text-white/50 transition-colors">
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
