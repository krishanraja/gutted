'use client'
import { haptic } from '@/lib/haptics'
import { useToast } from '@/components/ToastProvider'
import { LockIcon } from '@/components/icons'

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
  const { toast } = useToast()

  return (
    <div className="flex gap-1 overflow-x-auto hide-scrollbar border-b border-white/[0.06]">
      {tabs.map(tab => {
        const active = tab.key === activeTab
        return (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.locked) {
                haptic.tap()
                toast(tab.lockMessage || `${tab.label} is locked`, 'info')
                return
              }
              haptic.tap()
              onTabChange(tab.key)
            }}
            className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              active
                ? 'text-white'
                : tab.locked
                ? 'text-white/25 cursor-not-allowed'
                : 'text-white/55 hover:text-white/80'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            {tab.locked && <LockIcon size={12} />}
            {tab.label}
            {active && <span className="absolute -bottom-px left-3 right-3 h-[2px] bg-accent rounded-full" />}
          </button>
        )
      })}
    </div>
  )
}
