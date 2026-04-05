'use client'
import { haptic } from '@/lib/haptics'

interface Tab {
  key: string
  label: string
  locked?: boolean
  lockMessage?: string
}

interface SectionNavProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (key: string) => void
}

export function SectionNav({ tabs, activeTab, onTabChange }: SectionNavProps) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide px-1 py-1 bg-white/5 rounded-xl">
      {tabs.map(tab => {
        const active = tab.key === activeTab
        return (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.locked) return
              haptic.tap()
              onTabChange(tab.key)
            }}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              active
                ? 'bg-gradient-to-r from-[#00B4B4]/20 to-[#4ADE80]/15 text-[#4ADE80] shadow-sm'
                : tab.locked
                ? 'text-white/20 cursor-not-allowed'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {tab.locked && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
