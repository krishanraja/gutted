'use client'
import { ReactNode } from 'react'

type Phase = 'input' | 'processing' | 'results'

interface PhaseViewProps {
  phase: Phase
  input: ReactNode
  processing?: ReactNode
  results: ReactNode
  processingText?: string
}

export function PhaseView({ phase, input, processing, results, processingText = 'Analysing...' }: PhaseViewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {phase === 'input' && (
        <div className="flex-1 flex flex-col animate-fade-in">
          {input}
        </div>
      )}

      {phase === 'processing' && (
        <div className="flex-1 flex flex-col items-center justify-center animate-scale-in">
          {processing || (
            <>
              <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4" />
              <p className="text-white/50 text-sm">{processingText}</p>
              <div className="w-48 h-1 rounded-full mt-4 animate-shimmer" />
            </>
          )}
        </div>
      )}

      {phase === 'results' && (
        <div className="flex-1 flex flex-col animate-scale-in overflow-y-auto">
          {results}
        </div>
      )}
    </div>
  )
}
