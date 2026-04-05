'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { getPlanLimits } from '@/lib/plan-limits'
import Link from 'next/link'

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

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('plan, name').eq('id', user.id).single()
      setPlan(profile?.plan || 'free')

      // Welcome message
      setMessages([{
        role: 'assistant',
        content: `Hey ${profile?.name || 'there'}! I'm your gut health coach. I can see your logs, test results, and patterns. Ask me anything about your gut health - like what to eat, why your score changed, or how to manage symptoms.`,
      }])
    }
    load()
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || sending) return

    setInput('')
    setError('')
    const newMessages: Message[] = [...messages, { role: 'user', content: messageText }]
    setMessages(newMessages)
    setSending(true)

    try {
      const res = await fetch('/api/gut-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.filter(m => m.role !== 'assistant' || newMessages.indexOf(m) > 0).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch (e: unknown) {
      setError((e as Error).message || 'Could not get response')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  if (!limits.gutCoach) {
    return (
      <div className="bg-black">
        <div className="px-6 pt-12 pb-6">
          <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-2xl font-bold">Gut Coach</h1>
        </div>
        <div className="px-6">
          <div className="text-center py-10 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-4xl mb-4">🧠</div>
            <p className="font-semibold mb-2">Unlock your AI Gut Coach</p>
            <p className="text-white/40 text-sm mb-6">Get personalised answers about your gut health based on your logs, test results, and patterns.</p>
            <Link href="/dashboard/settings" className="text-[#4ADE80] text-sm font-medium hover:underline">Upgrade to Core →</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 shrink-0">
        <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] flex items-center justify-center text-xl">🧠</div>
          <div>
            <h1 className="text-lg font-bold">Gut Coach</h1>
            <p className="text-white/40 text-xs">Powered by your health data</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] text-black'
                : 'bg-white/5 border border-white/10 text-white/80'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {/* Suggested questions (only show at start) */}
        {messages.length <= 1 && (
          <div className="space-y-2">
            <p className="text-white/30 text-xs uppercase tracking-wide">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-3 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:border-[#00B4B4]/30 hover:text-white/70 transition-colors text-left"
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
      <div className="px-6 pb-24 md:pb-6 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about your gut health..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00B4B4]/50 transition-colors"
          />
          <Button onClick={() => send()} loading={sending} disabled={!input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
