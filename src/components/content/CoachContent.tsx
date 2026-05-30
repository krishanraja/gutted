'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { getPlanLimits } from '@/lib/plan-limits'
import Link from 'next/link'
import { ChatIcon, ArrowRightIcon } from '@/components/icons'

interface Message { role: 'user' | 'assistant'; content: string }

const suggestedQuestions = [
  'Why did my gut score drop this week?',
  'What should I eat before a flight?',
  'Is dairy okay for my condition?',
  'What are the best foods for my gut?',
  'How can I reduce bloating?',
  'Should I try a low-FODMAP diet?',
]

export function CoachContent() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [plan, setPlan] = useState('free')
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const limits = getPlanLimits(plan)
  const lastMessage = messages[messages.length - 1]
  const awaitingFirstToken = sending && lastMessage?.role === 'assistant' && !lastMessage.content

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('plan, name').eq('id', user.id).single()
      if (cancelled) return
      setPlan(profile?.plan || 'free')

      // Free plan cannot use the coach (the render shows an upgrade CTA), so do
      // not load history or call the proactive opener (it would 403).
      if (!getPlanLimits(profile?.plan || 'free').gutCoach) return

      // Restore the prior thread instead of resetting to a single greeting each
      // session. Pull the most recent turns and render them chronologically.
      const { data: history } = await supabase
        .from('coach_messages')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40)
      if (cancelled) return

      const restored: Message[] = (history || [])
        .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length > 0)
        .reverse()
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))

      // Does the restored thread already contain a turn from today? If so we
      // pick the conversation back up; if not, the coach opens proactively.
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      const hasThreadToday = (history || []).some(m => {
        const t = m.created_at ? new Date(m.created_at).getTime() : 0
        return t >= startOfToday.getTime()
      })

      if (restored.length && hasThreadToday) {
        setMessages(restored)
        return
      }

      // No conversation yet today: greet proactively with a line grounded in
      // their own data. Show prior history (if any) above the fresh opener so
      // the thread still feels continuous.
      try {
        const res = await fetch('/api/coach-opener', { method: 'POST' })
        const data = await res.json().catch(() => null)
        if (cancelled) return
        const opener = res.ok && typeof data?.opener === 'string' && data.opener.trim()
          ? data.opener.trim()
          : `Hi ${profile?.name || 'there'}. I'm your gut health coach. I can see your logs, test results, and patterns. Ask me anything about your gut, what to eat, why your score changed, or how to manage symptoms.`
        setMessages([...restored, { role: 'assistant', content: opener }])
      } catch {
        if (cancelled) return
        setMessages([...restored, {
          role: 'assistant',
          content: `Hi ${profile?.name || 'there'}. I'm your gut health coach. I can see your logs, test results, and patterns. Ask me anything about your gut, what to eat, why your score changed, or how to manage symptoms.`,
        }])
      }
    }
    load()
    return () => { cancelled = true }
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || sending) return

    setInput('')
    setError('')
    const baseMessages: Message[] = [...messages, { role: 'user', content: messageText }]
    // Show the user's message immediately, plus an empty assistant slot that the
    // streamed tokens fill in as they arrive.
    setMessages([...baseMessages, { role: 'assistant', content: '' }])
    setSending(true)

    try {
      const res = await fetch('/api/gut-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: baseMessages
            .filter(m => m.role === 'user')
            .map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok || !res.body) {
        let message = 'Could not get response'
        try {
          const data = await res.json()
          if (data?.error) message = data.error
        } catch {}
        throw new Error(message)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      let done = false
      while (!done) {
        const chunk = await reader.read()
        done = chunk.done
        if (chunk.value) {
          acc += decoder.decode(chunk.value, { stream: true })
          setMessages(prev => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: acc }
            return next
          })
        }
      }

      if (!acc.trim()) throw new Error('Coach did not respond. Try again.')
    } catch (e: unknown) {
      // Drop a still-empty assistant slot so we never leave a blank bubble, then
      // surface a soft error. Any text already streamed in stays on screen.
      setMessages(prev => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'assistant' && !last.content.trim()) next.pop()
        return next
      })
      setError((e as Error).message || 'Could not get response')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  if (!limits.gutCoach) {
    return (
      <div className="bg-black">
        <div className="px-5 pt-safe pb-5 md:px-6 md:pt-10">
          <button onClick={() => router.back()} className="text-white/45 text-sm mb-4 inline-flex items-center gap-1 pt-3 md:pt-0 hover:text-white transition-colors">
            <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-xl md:text-2xl font-medium tracking-tight">Gut Coach</h1>
        </div>
        <div className="px-5 md:px-6">
          <div className="text-center py-10 bg-white/[0.04] border border-white/[0.08] rounded-xl p-6">
            <ChatIcon size={28} className="mx-auto text-white/35 mb-3" />
            <p className="font-medium mb-2">Unlock your AI Gut Coach</p>
            <p className="text-white/55 text-sm mb-6">Get personalised answers grounded in your logs, test results, and patterns.</p>
            <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-white transition-colors">Upgrade to Core <ArrowRightIcon size={14} /></Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black flex flex-col">
      {/* Header */}
      <div className="px-5 pt-safe pb-4 shrink-0 md:px-6 md:pt-10">
        <button onClick={() => router.back()} className="text-white/45 text-sm mb-4 inline-flex items-center gap-1 pt-3 md:pt-0 hover:text-white transition-colors">
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center text-accent">
            <ChatIcon size={18} />
          </div>
          <div>
            <h1 className="text-lg font-medium tracking-tight">Gut Coach</h1>
            <p className="text-white/45 text-xs">Powered by your health data.</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 md:px-6 space-y-3 pb-4">
        {messages.map((msg, i) => {
          // Skip the empty assistant slot until its first token lands; the
          // typing indicator below stands in for it.
          if (msg.role === 'assistant' && !msg.content) return null
          return (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-accent/15 border border-accent/30 text-white'
                  : 'bg-white/[0.04] border border-white/[0.08] text-white/85'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          )
        })}

        {awaitingFirstToken && (
          <div className="flex justify-start">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-white/35 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-white/35 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-white/35 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-[#E96363] text-sm text-center">{error}</p>}

        {/* Suggested questions (only show at start) */}
        {messages.length <= 1 && (
          <div className="space-y-2 pt-2">
            <p className="text-white/35 text-[11px] uppercase tracking-wider">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm text-white/65 hover:border-white/15 hover:bg-white/[0.06] hover:text-white/85 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 md:px-6 pb-24 md:pb-6 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about your gut health…"
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-accent-50 transition-colors"
          />
          <Button onClick={() => send()} loading={sending} disabled={!input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
