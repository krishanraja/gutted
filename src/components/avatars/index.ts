import type { ComponentType } from 'react'
import { BloatBalloon } from './BloatBalloon'
import { ZenGuru } from './ZenGuru'
import { DashRunner } from './DashRunner'
import { ProbioticPal } from './ProbioticPal'
import { FiberFriend } from './FiberFriend'
import { GurgleSleuth } from './GurgleSleuth'

export interface AvatarOption {
  id: string
  name: string
  Component: ComponentType
  gradient: string
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'bloat-balloon',
    name: 'Bloat Balloon',
    Component: BloatBalloon,
    gradient: 'bg-gradient-to-br from-[#00B4B4] to-[#F472B6]',
  },
  {
    id: 'zen-guru',
    name: 'Zen Gut Guru',
    Component: ZenGuru,
    gradient: 'bg-gradient-to-br from-[#6366F1] to-[#4ADE80]',
  },
  {
    id: 'dash-runner',
    name: 'Bathroom Sprinter',
    Component: DashRunner,
    gradient: 'bg-gradient-to-br from-[#F59E0B] to-[#EF4444]',
  },
  {
    id: 'probiotic-pal',
    name: 'Probiotic Pal',
    Component: ProbioticPal,
    gradient: 'bg-gradient-to-br from-[#00B4B4] to-[#FDE68A]',
  },
  {
    id: 'fiber-friend',
    name: 'Fiber Friend',
    Component: FiberFriend,
    gradient: 'bg-gradient-to-br from-[#10B981] to-[#A3E635]',
  },
  {
    id: 'gurgle-sleuth',
    name: 'Gurgle Sleuth',
    Component: GurgleSleuth,
    gradient: 'bg-gradient-to-br from-[#8B5CF6] to-[#00B4B4]',
  },
]

export function getAvatarOption(id: string | null | undefined): AvatarOption | undefined {
  if (!id) return undefined
  return AVATAR_OPTIONS.find(o => o.id === id)
}
