'use client'
import { useRouter } from 'next/navigation'
import { UploadContent } from '@/components/content/UploadContent'

export default function UploadPage() {
  const router = useRouter()

  return (
    <>
      <div className="mobile-viewport md:hidden">
        <div className="px-5 pt-safe pb-2">
          <button onClick={() => router.back()} className="text-white/45 text-sm mb-3 inline-flex items-center gap-1 pt-3 hover:text-white transition-colors">
            <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 className="text-xl font-medium tracking-tight">Upload &amp; analyse</h1>
        </div>
        <div className="flex-1 overflow-y-auto pb-nav">
          <UploadContent />
        </div>
      </div>

      <div className="hidden md:block min-h-screen bg-black pb-8 md:ml-60 lg:ml-64">
        <div className="px-6 pt-10 pb-2 max-w-3xl">
          <button onClick={() => router.back()} className="text-white/45 text-sm mb-3 inline-flex items-center gap-1 hover:text-white transition-colors">
            <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 className="text-2xl font-medium tracking-tight">Upload &amp; analyse</h1>
        </div>
        <UploadContent />
      </div>
    </>
  )
}
