import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const audio = form.get('audio') as File
    if (!audio) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'en',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (err) {
    console.error('Transcribe error:', err)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
