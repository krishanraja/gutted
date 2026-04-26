'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { GutScore } from '@/components/GutScore'
import { haptic } from '@/lib/haptics'
import { CheckIcon, LockIcon, AlertIcon, ArrowRightIcon } from '@/components/icons'

interface Analysis {
  gutScore: number
  summary: string
  insights: string[]
  recommendations: string[]
  flagged: boolean
}

type Phase = 'prompts' | 'processing' | 'results' | 'celebration'

interface Answers {
  symptoms: string[]
  meals: string[]
  mealText: string
  lifestyle: string[]
}

const EMPTY_ANSWERS: Answers = { symptoms: [], meals: [], mealText: '', lifestyle: [] }
const STORAGE_KEY = 'gutted-wizard-progress'

const symptomOptions = [
  { value: 'Good' },
  { value: 'Okay' },
  { value: 'Rough' },
  { value: 'Bloated' },
  { value: 'Heartburn' },
  { value: 'Nausea' },
  { value: 'Irregular' },
  { value: 'Fatigued' },
]

const mealOptions = [
  { value: 'Porridge' },
  { value: 'Sandwich' },
  { value: 'Pasta' },
  { value: 'Chicken' },
  { value: 'Salad' },
  { value: 'Coffee' },
  { value: 'Pizza' },
  { value: 'Rice' },
]

const lifestyleOptions = [
  { value: 'Stressed' },
  { value: 'Slept badly' },
  { value: 'Took meds' },
  { value: 'Exercised' },
  { value: 'Alcohol' },
  { value: 'Well hydrated' },
  { value: 'Relaxed' },
  { value: 'Ate late' },
]

const intros = [
  { heading: "Let's get to know your gut", sub: 'Takes about 30 seconds.' },
  { heading: 'Quick check-in.', sub: 'Building your picture.' },
  { heading: 'One more.', sub: "You'll unlock History & trends." },
]

const milestones = [
  { message: 'Gut score unlocked.', next: '2 more for History & trends.' },
  { message: 'Keep going.', next: '1 more for History & trends.' },
  { message: 'History & trends unlocked.', next: "You're all set." },
]

interface GuidedLogWizardProps {
  logCount: number
  userProfile: Record<string, unknown> | null
  userId: string
  onComplete: () => void
}

export function GuidedLogWizard({ logCount, userProfile, userId, onComplete }: GuidedLogWizardProps) {
  const [wizardStep, setWizardStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('prompts')
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMealText, setShowMealText] = useState(false)

  const totalSteps = 3
  const intro = intros[Math.min(logCount, 2)]
  const milestone = milestones[Math.min(logCount, 2)]

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (parsed.logCount !== logCount) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      if (parsed.step !== undefined) setWizardStep(parsed.step)
      if (parsed.answers) setAnswers(parsed.answers)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [logCount])

  const persist = useCallback((step: number, ans: Answers) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, answers: ans, logCount }))
    } catch { /* quota exceeded */ }
  }, [logCount])

  const toggleSymptom = (val: string) => {
    haptic.tap()
    setAnswers(prev => {
      const next = { ...prev, symptoms: prev.symptoms.includes(val) ? prev.symptoms.filter(v => v !== val) : [...prev.symptoms, val] }
      persist(wizardStep, next)
      return next
    })
  }

  const toggleMeal = (val: string) => {
    haptic.tap()
    setAnswers(prev => {
      const next = { ...prev, meals: prev.meals.includes(val) ? prev.meals.filter(v => v !== val) : [...prev.meals, val] }
      persist(wizardStep, next)
      return next
    })
  }

  const toggleLifestyle = (val: string) => {
    haptic.tap()
    setAnswers(prev => {
      const next = { ...prev, lifestyle: prev.lifestyle.includes(val) ? prev.lifestyle.filter(v => v !== val) : [...prev.lifestyle, val] }
      persist(wizardStep, next)
      return next
    })
  }

  const composeLogText = () => {
    const parts: string[] = []
    if (answers.symptoms.length) parts.push(`Gut feeling: ${answers.symptoms.join(', ')}.`)
    const allMeals = [...answers.meals]
    if (answers.mealText.trim()) allMeals.push(answers.mealText.trim())
    if (allMeals.length) parts.push(`Ate: ${allMeals.join(', ')}.`)
    if (answers.lifestyle.length) parts.push(answers.lifestyle.join(', ') + '.')
    return parts.join(' ') || 'General gut check-in.'
  }

  const analyseAndSave = async () => {
    const text = composeLogText()
    setPhase('processing')
    haptic.medium()
    setError('')

    try {
      const res = await fetch('/api/analyse-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userProfile, recentLogs: [] }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAnalysis(data)
      setPhase('results')
    } catch (e: unknown) {
      setError((e as Error).message || 'Analysis failed')
      setPhase('prompts')
    }
  }

  const save = async () => {
    if (!analysis || !userId) return
    setSaving(true)
    const supabase = createClient()
    const content = composeLogText()

    await supabase.from('logs').insert({
      user_id: userId,
      type: 'text',
      content,
      gut_score: analysis.gutScore,
      ai_analysis: analysis,
    })

    haptic.success()
    localStorage.removeItem(STORAGE_KEY)
    setPhase('celebration')
    setSaving(false)
  }

  const goNext = () => {
    if (wizardStep < totalSteps - 1) {
      const next = wizardStep + 1
      setWizardStep(next)
      persist(next, answers)
    } else {
      analyseAndSave()
    }
  }

  const goBack = () => {
    if (wizardStep > 0) {
      const prev = wizardStep - 1
      setWizardStep(prev)
      persist(prev, answers)
    }
  }

  const progress = phase === 'prompts'
    ? ((wizardStep + 1) / totalSteps) * 80
    : phase === 'processing' ? 90
    : 100

  const canContinue = wizardStep === 0
    ? answers.symptoms.length > 0
    : true

  const renderGrid = (
    options: { value: string }[],
    selected: string[],
    onToggle: (val: string) => void,
  ) => (
    <div className="grid grid-cols-2 gap-2">
      {options.map(opt => {
        const isSelected = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            onClick={() => onToggle(opt.value)}
            className={`px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
              isSelected
                ? 'border-accent bg-accent/[0.08] text-white'
                : 'border-white/[0.08] bg-white/[0.04] text-white/70 hover:border-white/15 hover:bg-white/[0.06]'
            }`}
          >
            <span className="text-sm font-medium">{opt.value}</span>
          </button>
        )
      })}
    </div>
  )

  // --- Prompts phase ---
  if (phase === 'prompts') {
    return (
      <div className="animate-fade-in">
        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="num text-white/35 text-[11px] uppercase tracking-wider">
              Step {wizardStep + 1} of {totalSteps}
            </p>
            <p className="num text-white/35 text-[11px]">{Math.round(progress)}%</p>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1">
            <div
              className="h-1 rounded-full bg-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Intro -- only on step 0 */}
        {wizardStep === 0 && (
          <div className="text-center mb-4 animate-fade-up">
            <h2 className="text-lg font-medium tracking-tight mb-1">{intro.heading}</h2>
            <p className="text-white/50 text-sm">{intro.sub}</p>
          </div>
        )}

        {/* Back button */}
        {wizardStep > 0 && (
          <button onClick={goBack} className="text-white/45 text-sm mb-3 inline-flex items-center gap-1 hover:text-white transition-colors">
            <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
        )}

        {/* Step content */}
        <div className="animate-fade-in">
          {wizardStep === 0 && (
            <>
              <p className="text-sm font-medium mb-3">How&apos;s your gut right now?</p>
              {renderGrid(symptomOptions, answers.symptoms, toggleSymptom)}
            </>
          )}

          {wizardStep === 1 && (
            <>
              <p className="text-sm font-medium mb-3">What have you eaten recently?</p>
              {renderGrid(mealOptions, answers.meals, toggleMeal)}
              {!showMealText ? (
                <button
                  onClick={() => setShowMealText(true)}
                  className="text-white/40 text-xs mt-3 hover:text-white/65 transition-colors"
                >
                  + Something else?
                </button>
              ) : (
                <input
                  type="text"
                  value={answers.mealText}
                  onChange={e => {
                    const val = e.target.value
                    setAnswers(prev => {
                      const next = { ...prev, mealText: val }
                      persist(wizardStep, next)
                      return next
                    })
                  }}
                  placeholder="e.g. smoothie, eggs, soup…"
                  className="w-full mt-3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-50 transition-colors"
                  autoFocus
                />
              )}
            </>
          )}

          {wizardStep === 2 && (
            <>
              <p className="text-sm font-medium mb-3">Anything else going on?</p>
              {renderGrid(lifestyleOptions, answers.lifestyle, toggleLifestyle)}
            </>
          )}
        </div>

        {error && <p className="text-[#E96363] text-sm mt-3">{error}</p>}

        {/* Actions */}
        <div className="mt-4 space-y-2">
          <Button onClick={goNext} className="w-full" disabled={!canContinue}>
            {wizardStep === totalSteps - 1 ? 'Analyse my gut' : 'Continue'}
          </Button>
          {wizardStep > 0 && (
            <button onClick={goNext} className="w-full text-center text-white/35 text-sm hover:text-white/55 transition-colors">
              {wizardStep === totalSteps - 1 ? 'Skip & analyse' : 'Skip'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // --- Processing phase ---
  if (phase === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-scale-in">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4" />
        <p className="text-white/55 text-sm">Analysing your gut check…</p>
        <div className="w-40 h-1 rounded-full mt-3 animate-shimmer" />
      </div>
    )
  }

  // --- Results phase ---
  if (phase === 'results' && analysis) {
    return (
      <div className="animate-scale-in space-y-3">
        <Card className="flex items-center gap-4">
          <GutScore score={analysis.gutScore} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-white/45 text-[11px] uppercase tracking-wider mb-1">Your gut score</p>
            <p className="text-sm text-white/80 line-clamp-3">{analysis.summary}</p>
          </div>
        </Card>

        {analysis.insights.length > 0 && (
          <Card>
            <p className="text-white/45 text-[11px] uppercase tracking-wider mb-2">Insights</p>
            <ul className="space-y-1.5">
              {analysis.insights.map((insight, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/75">
                  <span className="text-accent mt-0.5 shrink-0">•</span>{insight}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {analysis.recommendations.length > 0 && (
          <Card>
            <p className="text-white/45 text-[11px] uppercase tracking-wider mb-2">Recommendations</p>
            <ul className="space-y-1.5">
              {analysis.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/75">
                  <ArrowRightIcon size={12} className="text-accent shrink-0 mt-1" />{rec}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {analysis.flagged && (
          <div className="flex items-start gap-2 px-1">
            <AlertIcon size={14} className="text-[#E8AE1E] shrink-0 mt-0.5" />
            <p className="text-[#E8AE1E] text-xs">Some symptoms may benefit from a chat with your doctor.</p>
          </div>
        )}

        <Button onClick={save} loading={saving} className="w-full" size="lg">
          Save log
        </Button>
      </div>
    )
  }

  // --- Celebration phase ---
  if (phase === 'celebration' && analysis) {
    return (
      <div className="flex flex-col items-center py-8 animate-scale-in text-center">
        <GutScore score={analysis.gutScore} size="lg" />
        <p className="text-lg font-medium tracking-tight mt-4 mb-1">{milestone.message}</p>
        <p className="text-white/45 text-sm mb-6">{milestone.next}</p>

        {/* Unlock progress indicator */}
        <div className="w-full space-y-2 mb-6 px-2">
          {[
            { count: 1, feature: 'Gut score & overview', unlocked: logCount + 1 >= 1 },
            { count: 3, feature: 'History & trends', unlocked: logCount + 1 >= 3 },
            { count: 5, feature: 'AI Coach & patterns', unlocked: logCount + 1 >= 5 },
          ].map(item => (
            <div key={item.feature} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${item.unlocked ? 'bg-white/[0.06] border border-white/[0.10]' : 'bg-white/[0.03]'}`}>
              {item.unlocked ? (
                <CheckIcon size={14} className="text-[#3FBE6F] shrink-0" />
              ) : (
                <LockIcon size={14} className="text-white/25 shrink-0" />
              )}
              <span className="num text-xs text-white/45">{item.count} log{item.count > 1 ? 's' : ''}</span>
              <span className={`text-xs ${item.unlocked ? 'text-white/85' : 'text-white/55'}`}>{item.feature}</span>
            </div>
          ))}
        </div>

        <Button onClick={onComplete} className="w-full">
          Continue
        </Button>
      </div>
    )
  }

  return null
}
