'use client'
import { useRouter } from 'next/navigation'
import { UploadContent } from '@/components/content/UploadContent'

export default function UploadPage() {
  const router = useRouter()

  return (
    <>
      <div className="mobile-viewport md:hidden">
        <div className="px-6 pt-12 pb-2">
          <button onClick={() => router.back()} className="text-white/40 text-sm mb-3 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 className="text-2xl font-bold">Upload & analyse</h1>
        </div>
        <div className="flex-1 overflow-y-auto pb-nav">
          <UploadContent />
        </div>
      </div>

      <div className="hidden md:block min-h-screen bg-black pb-8 md:ml-60 lg:ml-64">
        <div className="px-6 pt-12 pb-2 max-w-3xl">
          <button onClick={() => router.back()} className="text-white/40 text-sm mb-3 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 className="text-2xl font-bold">Upload & analyse</h1>
        </div>
        <UploadContent />
      </div>
    </>
  )
}
