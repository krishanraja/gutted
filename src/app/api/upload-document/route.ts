import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateFile, rateLimit } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { allowed } = rateLimit(`upload:${user.id}`, { maxRequests: 20, windowMs: 60_000 })
    if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const form = await req.formData()
    const file = form.get('file') as File
    const type = form.get('type') as string

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const { valid, error: fileError, sanitizedExt } = validateFile(file, 'document')
    if (!valid) return NextResponse.json({ error: fileError }, { status: 400 })

    const path = `${user.id}/${Date.now()}.${sanitizedExt}`

    const { error } = await supabase.storage.from('documents').upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
    if (error) throw error

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
    const fileUrl = urlData.publicUrl

    await supabase.from('documents').insert({
      user_id: user.id,
      type,
      file_url: fileUrl,
      file_name: file.name,
    })

    return NextResponse.json({ fileUrl })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
