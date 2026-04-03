'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

const goals = ['Reduce bloating', 'Improve digestion', 'Understand my test results', 'Lose weight', 'Increase energy', 'Reduce pain']
const restrictions = ['Gluten-free', 'Dairy-free', 'Vegan', 'Vegetarian', 'Low-FODMAP', 'Keto', 'Paleo', 'None']
const conditions = ['IBS', 'SIBO', "Crohn's", 'Colitis', 'Celiac', 'GERD', 'Leaky gut', 'None', 'Prefer not to say']

function ToggleChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button" onClick={onToggle}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95 ${
        selected ? 'bg-[#4ADE80]/20 border-[#4ADE80]/60 text-[#4ADE80]' : 'bg-white/5 border-white/20 text-white/70'
      }`}
    >
      {label}
    </button>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    name: '',
    goals: [] as string[],
    restrictions: [] as string[],
    conditions: [] as string[],
    currentScore: 5,
  })

  const toggle = (field: 'goals' | 'restrictions' | 'conditions', val: string) => {
    setData(d => ({
      ...d,
      [field]: d[field].includes(val) ? d[field].filter(x => x !== val) : [...d[field], val],
    }))
  }

  const steps = [
    {
      title: "What's your name?",
      content: (
        <input
          type="text" value={data.name} onChange={e => setData(d => ({ ...d, name: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg placeholder-white/30 focus:outline-none focus:border-[#4ADE80]/50"
          placeholder="First name"
          autoFocus
        />
      ),
    },
    {
      title: 'What are your gut health goals?',
      content: (
        <div className="flex flex-wrap gap-2">
          {goals.map(g => <ToggleChip key={g} label={g} selected={data.goals.includes(g)} onToggle={() => toggle('goals', g)}/>)}
        </div>
      ),
    },
    {
      title: 'Any dietary restrictions?',
      content: (
        <div className="flex flex-wrap gap-2">
          {restrictions.map(r => <ToggleChip key={r} label={r} selected={data.restrictions.includes(r)} onToggle={() => toggle('restrictions', r)}/>)}
        </div>
      ),
    },
    {
      title: 'Any diagnosed conditions?',
      content: (
        <div className="flex flex-wrap gap-2">
          {conditions.map(c => <ToggleChip key={c} label={c} selected={data.conditions.includes(c)} onToggle={() => toggle('conditions', c)}/>)}
        </div>
      ),
    },
    {
      title: 'Rate your current gut health',
      subtitle: '1 = very poor, 10 = excellent',
      content: (
        <div className="text-center space-y-6">
          <div className="text-7xl font-bold gradient-text">{data.currentScore}</div>
          <input
            type="range" min={1} max={10} value={data.currentScore}
            onChange={e => setData(d => ({ ...d, currentScore: Number(e.target.value) }))}
            className="w-full accent-[#4ADE80]"
          />
          <div className="flex justify-between text-white/30 text-xs">
            <span>Very poor</span><span>Excellent</span>
          </div>
        </div>
      ),
    },
  ]

  const isLast = step === steps.length - 1
  const canNext = step === 0 ? data.name.trim().length > 0 : true

  const next = async () => {
    if (!isLast) { setStep(s => s + 1); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        name: data.name,
        onboarding_complete: true,
        gut_profile: {
          goals: data.goals,
          restrictions: data.restrictions,
          conditions: data.conditions,
          baselineScore: data.currentScore,
        },
      }).eq('id', user.id)
    }
    router.push('/dashboard')
  }

  const current = steps[step]
  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="min-h-screen flex flex-col px-5 max-w-md mx-auto py-8">
      <div className="flex items-center gap-3 mb-10">
        <Image src="/logo.png" alt="gutted." width={80} height={24} className="h-6 w-auto"/>
        <div className="flex-1 bg-white/10 rounded-full h-1 overflow-hidden">
          <div className="bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}/>
        </div>
        <span className="text-white/30 text-xs">{step + 1}/{steps.length}</span>
      </div>

      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-2">{current.title}</h1>
        {'subtitle' in current && current.subtitle && <p className="text-white/50 mb-6 text-sm">{current.subtitle}</p>}
        {!('subtitle' in current) && <div className="mb-6"/>}
        {current.content}
      </div>

      <div className="flex gap-3 mt-8 pb-6">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">Back</Button>
        )}
        <Button onClick={next} disabled={!canNext} loading={loading} className={`flex-1 ${isLast ? '' : ''}`}>
          {isLast ? 'Take me to my dashboard' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
