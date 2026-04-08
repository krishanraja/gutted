'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { GutScore } from '@/components/GutScore'
import { haptic } from '@/lib/haptics'

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
  { value: 'Good', icon: '😊' },
  { value: 'Okay', icon: '😐' },
  { value: 'Rough', icon: '😫' },
  { value: 'Bloated', icon: '🫧' },
  { value: 'Heartburn', icon: '🔥' },
  { value: 'Nausea', icon: '🤢' },
  { value: 'Irregular', icon: '💩' },
  { value: 'Fatigued', icon: '😴' },
]

const mealOptions = [
  { value: 'Porridge', icon: '🥣' },
  { value: 'Sandwich', icon: '🥪' },
  { value: 'Pasta', icon: '🍝' },
  { value: 'Chicken', icon: '🍗' },
  { value: 'Salad', icon: '🥗' },
  { value: 'Coffee', icon: '☕' },
  { value: 'Pizza', icon: '🍕' },
  { value: 'Rice', icon: '🍚' },
]

const lifestyleOptions = [
  { value: 'Stressed', icon: '😰' },
  { value: 'Slept badly', icon: '😴' },
  { value: 'Took meds', icon: '💊' },
  { value: 'Exercised', icon: '🏃' },
  { value: 'Alcohol', icon: '🍷' },
  { value: 'Well hydrated', icon: '💧' },
  { value: 'Relaxed', icon: '🧘' },
  { value: 'Ate late', icon: '⏰' },
]

const intros = [
  { heading: "Let's get to know your gut", sub: 'It only takes 30 seconds' },
  { heading: 'Nice one! Quick check-in', sub: "Let's build on that" },
  { heading: 'One more to go', sub: "You'll unlock History & Trends" },
]

const milestones = [
  { message: 'Gut Score unlocked!', next: '2 more for History & Trends' },
  { message: 'Keep going!', next: '1 more for History & Trends' },
  { message: 'History & Trends unlocked!', next: "You're all set." },
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

  // Restore progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      // If logCount changed since last save, start fresh
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

  // Persist progress
  const persist = useCallback((step: number, ans: Answers) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, answers: ans, logCount }))
    } catch { /* quota exceeded -- non-critical */ }
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
      // Last step -- go straight to analysis
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
    ? ((wizardStep + 1) / totalSteps) * 80 // 80% for prompt steps
    : phase === 'processing' ? 90
    : 100

  // Can continue from step 1 only if at least one symptom selected
  const canContinue = wizardStep === 0
    ? answers.symptoms.length > 0
    : true // meals and lifestyle are optional

  const renderGrid = (
    options: { value: string; icon: string }[],
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
            className={`p-3 rounded-2xl border text-left transition-all ${
              isSelected
                ? 'border-[#00B4B4] bg-[#00B4B4]/10 shadow-lg shadow-[#00B4B4]/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{opt.icon}</span>
              <span className={`text-sm font-medium ${isSelected ? 'text-[#4ADE80]' : 'text-white/70'}`}>
                {opt.value}
              </span>
            </div>
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
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-white/30 text-[10px] uppercase tracking-wide">
              Step {wizardStep + 1} of {totalSteps}
            </p>
            <p className="text-white/30 text-[10px]">{Math.round(progress)}%</p>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1">
            <div
              className="h-1 rounded-full bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Intro -- only on step 0 */}
        {wizardStep === 0 && (
          <div className="text-center mb-3 animate-fade-up">
            <h2 className="text-lg font-bold mb-1">{intro.heading}</h2>
            <p className="text-white/40 text-sm">{intro.sub}</p>
          </div>
        )}

        {/* Back button */}
        {wizardStep > 0 && (
          <button onClick={goBack} className="text-white/40 text-sm mb-3 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
        )}

        {/* Step content */}
        <div className="animate-fade-in">
          {wizardStep === 0 && (
            <>
              <p className="text-sm font-semibold mb-3">How&apos;s your gut right now?</p>
              {renderGrid(symptomOptions, answers.symptoms, toggleSymptom)}
            </>
          )}

          {wizardStep === 1 && (
            <>
              <p className="text-sm font-semibold mb-3">What have you eaten recently?</p>
              {renderGrid(mealOptions, answers.meals, toggleMeal)}
              {!showMealText ? (
                <button
                  onClick={() => setShowMealText(true)}
                  className="text-white/30 text-xs mt-3 hover:text-white/50 transition-colors"
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
                  placeholder="e.g. smoothie, eggs, soup..."
                  className="w-full mt-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00B4B4]/50 transition-colors"
                  autoFocus
                />
              )}
            </>
          )}

          {wizardStep === 2 && (
            <>
              <p className="text-sm font-semibold mb-3">Anything else going on?</p>
              {renderGrid(lifestyleOptions, answers.lifestyle, toggleLifestyle)}
            </>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        {/* Actions */}
        <div className="mt-3 space-y-2">
          <Button onClick={goNext} className="w-full" disabled={!canContinue}>
            {wizardStep === totalSteps - 1 ? 'Analyse my gut' : 'Continue'}
          </Button>
          {wizardStep > 0 && (
            <button onClick={goNext} className="w-full text-center text-white/30 text-sm hover:text-white/50 transition-colors">
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
        <div className="w-12 h-12 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin mb-4" />
        <p className="text-white/50 text-sm">Analysing your gut check...</p>
        <div className="w-40 h-1 rounded-full mt-3 animate-shimmer" />
      </div>
    )
  }

  // --- Results phase ---
  if (phase === 'results' && analysis) {
    return (
      <div className="animate-scale-in space-y-3">
        <Card glow className="flex items-center gap-4">
          <GutScore score={analysis.gutScore} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-white/40 text-xs mb-1">Your gut score</p>
            <p className="text-sm text-white/80 line-clamp-3">{analysis.summary}</p>
          </div>
        </Card>

        {analysis.insights.length > 0 && (
          <Card>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Insights</p>
            <ul className="space-y-1.5">
              {analysis.insights.map((insight, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/70">
                  <span className="text-[#4ADE80] mt-0.5 shrink-0">•</span>{insight}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {analysis.recommendations.length > 0 && (
          <Card>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Recommendations</p>
            <ul className="space-y-1.5">
              {analysis.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/70">
                  <span className="text-[#00B4B4] mt-0.5 shrink-0">→</span>{rec}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {analysis.flagged && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-amber-400 text-sm">⚠️</span>
            <p className="text-amber-400 text-xs">Some symptoms may benefit from a chat with your doctor.</p>
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
        <p className="text-lg font-bold mt-4 mb-1">{milestone.message}</p>
        <p className="text-white/40 text-sm mb-6">{milestone.next}</p>

        {/* Unlock progress indicator */}
        <div className="w-full space-y-2 mb-6 px-2">
          {[
            { count: 1, feature: 'Gut Score & Overview', unlocked: logCount + 1 >= 1 },
            { count: 3, feature: 'History & Trends', unlocked: logCount + 1 >= 3 },
            { count: 5, feature: 'AI Coach & Patterns', unlocked: logCount + 1 >= 5 },
          ].map(item => (
            <div key={item.feature} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${item.unlocked ? 'bg-[#00B4B4]/10 border border-[#00B4B4]/20' : 'bg-white/5'}`}>
              {item.unlocked ? (
                <svg className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              )}
              <span className="text-xs text-white/40">{item.count} log{item.count > 1 ? 's' : ''}</span>
              <span className={`text-xs ${item.unlocked ? 'text-[#4ADE80]' : 'text-white/60'}`}>{item.feature}</span>
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
