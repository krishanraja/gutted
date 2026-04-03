import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    const form = await req.formData()
    const file = form.get('file') as File
    const type = form.get('type') as string

    const ext = file.name.split('.').pop()
    const path = `${user?.id || 'anon'}/${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('documents').upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
    if (error) throw error

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
    const fileUrl = urlData.publicUrl

    if (user) {
      await supabase.from('documents').insert({
        user_id: user.id,
        type,
        file_url: fileUrl,
        file_name: file.name,
      })
    }

    return NextResponse.json({ fileUrl })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
