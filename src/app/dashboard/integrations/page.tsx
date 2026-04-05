'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getPlanLimits } from '@/lib/plan-limits'
import Link from 'next/link'

interface MetricSummary { metric: string; count: number; avg: number; latest: number }
interface Correlation { metric: string; correlation: string; detail: string }

const metricLabels: Record<string, { label: string; emoji: string; unit: string }> = {
  sleep_hours: { label: 'Sleep', emoji: '😴', unit: 'hrs' },
  steps: { label: 'Steps', emoji: '🚶', unit: '' },
  hrv: { label: 'HRV', emoji: '💓', unit: 'ms' },
  resting_hr: { label: 'Resting HR', emoji: '❤️', unit: 'bpm' },
  water_ml: { label: 'Water', emoji: '💧', unit: 'ml' },
  exercise_mins: { label: 'Exercise', emoji: '🏃', unit: 'min' },
}

export default function IntegrationsPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<MetricSummary[]>([])
  const [correlations, setCorrelations] = useState<Correlation[]>([])
  const [manualEntry, setManualEntry] = useState({ metric: 'sleep_hours', value: '' })
  const [saving, setSaving] = useState(false)

  const limits = getPlanLimits(plan)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
      setPlan(profile?.plan || 'free')

      if (profile?.plan === 'pro') {
        const res = await fetch('/api/health-data?days=30')
        const data = await res.json()
        if (data.metrics) setMetrics(data.metrics)
        if (data.correlations) setCorrelations(data.correlations)
      }
      setLoading(false)
    }
    load()
  }, [router])

  const saveManualEntry = async () => {
    if (!manualEntry.value) return
    setSaving(true)
    try {
      await fetch('/api/health-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: [{
            source: 'manual',
            metric: manualEntry.metric,
            value: parseFloat(manualEntry.value),
            recorded_at: new Date().toISOString(),
          }],
        }),
      })
      setManualEntry(prev => ({ ...prev, value: '' }))
      // Refresh
      const res = await fetch('/api/health-data?days=30')
      const data = await res.json()
      if (data.metrics) setMetrics(data.metrics)
      if (data.correlations) setCorrelations(data.correlations)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-2xl font-bold">Health Integrations</h1>
        <p className="text-white/40 text-sm mt-1">Track sleep, exercise, and more to find what affects your gut</p>
      </div>

      {!limits.pdfReports ? (
        <div className="px-6">
          <Card className="text-center py-10">
            <div className="text-4xl mb-4">🔗</div>
            <p className="font-semibold mb-2">Unlock health integrations</p>
            <p className="text-white/40 text-sm mb-6">Upgrade to Pro to track sleep, exercise, stress, and more — and see how they affect your gut health.</p>
            <Link href="/dashboard/settings" className="text-[#4ADE80] text-sm font-medium hover:underline">Upgrade to Pro →</Link>
          </Card>
        </div>
      ) : (
        <div className="px-6 space-y-4 mb-6">
          {/* Platform connections */}
          <Card>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Connected platforms</p>
            <div className="space-y-3">
              {[
                { name: 'Apple Health', emoji: '🍎', status: 'coming_soon' },
                { name: 'Fitbit', emoji: '⌚', status: 'coming_soon' },
                { name: 'Oura Ring', emoji: '💍', status: 'coming_soon' },
                { name: 'Manual Entry', emoji: '✏️', status: 'active' },
              ].map(p => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{p.emoji}</span>
                    <span className="text-sm text-white/70">{p.name}</span>
                  </div>
                  <Badge variant={p.status === 'active' ? 'green' : 'neutral'}>
                    {p.status === 'active' ? 'Active' : 'Coming soon'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Manual entry */}
          <Card>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Log health data</p>
            <div className="flex gap-2 mb-3">
              <select
                value={manualEntry.metric}
                onChange={e => setManualEntry(prev => ({ ...prev, metric: e.target.value }))}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00B4B4]/50"
              >
                {Object.entries(metricLabels).map(([key, { label, emoji }]) => (
                  <option key={key} value={key}>{emoji} {label}</option>
                ))}
              </select>
              <input
                type="number"
                value={manualEntry.value}
                onChange={e => setManualEntry(prev => ({ ...prev, value: e.target.value }))}
                placeholder={metricLabels[manualEntry.metric]?.unit || 'Value'}
                className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00B4B4]/50"
              />
              <Button onClick={saveManualEntry} loading={saving} size="md">Add</Button>
            </div>
          </Card>

          {/* Metrics overview */}
          {metrics.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Your health metrics (30 days)</p>
              <div className="grid grid-cols-2 gap-3">
                {metrics.map(m => {
                  const info = metricLabels[m.metric] || { label: m.metric, emoji: '📊', unit: '' }
                  return (
                    <div key={m.metric} className="bg-white/5 rounded-xl p-3 text-center">
                      <span className="text-lg">{info.emoji}</span>
                      <p className="text-xl font-bold mt-1">{m.latest}{info.unit}</p>
                      <p className="text-white/40 text-xs">{info.label}</p>
                      <p className="text-white/20 text-xs">avg {m.avg}{info.unit}</p>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Gut correlations */}
          {correlations.length > 0 && (
            <Card className="border-[#00B4B4]/20 bg-[#00B4B4]/5">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Gut health correlations</p>
              <div className="space-y-3">
                {correlations.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={c.correlation === 'positive' ? 'text-[#4ADE80]' : 'text-red-400'}>
                      {c.correlation === 'positive' ? '📈' : '📉'}
                    </span>
                    <p className="text-sm text-white/70">{c.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {metrics.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-2xl mb-2">📊</p>
              <p className="text-white/50 text-sm">Start logging health data to see how sleep, exercise, and stress affect your gut.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
