import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { validateFile, rateLimit } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { allowed } = rateLimit(`transcribe:${user.id}`, { maxRequests: 15, windowMs: 60_000 })
    if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const fd = await req.formData()
    const audio = fd.get('audio') as File
    if (!audio) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

    const { valid, error: fileError } = validateFile(audio, 'audio')
    if (!valid) return NextResponse.json({ error: fileError }, { status: 400 })

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'en',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (e: unknown) {
    console.error('Transcribe error:', e)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
