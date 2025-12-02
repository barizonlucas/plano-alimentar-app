import React, { createContext, useContext, useEffect, useState } from 'react'
import { Badge, MealLog, UserStats } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { isSameDay, parseISO, differenceInDays } from 'date-fns'

interface ProgressContextType {
  logs: MealLog[]
  stats: UserStats
  badges: Badge[]
  addLog: (log: MealLog) => void
  clearData: () => void
}

const INITIAL_STATS: UserStats = {
  totalPoints: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalLogs: 0,
}

const INITIAL_BADGES: Badge[] = [
  {
    id: 'first-meal',
    name: 'Primeiro Passo',
    description: 'Registrou a primeira refeição',
    icon: '🏁',
    unlocked: false,
  },
  {
    id: 'perfect-day',
    name: 'Dia Perfeito',
    description: '100% de aderência em todas as refeições de um dia',
    icon: '🌟',
    unlocked: false,
  },
  {
    id: 'streak-3',
    name: 'Consistência',
    description: 'Manteve o plano por 3 dias seguidos',
    icon: '🔥',
    unlocked: false,
  },
  {
    id: 'master',
    name: 'Mestre da Dieta',
    description: 'Acumulou 1000 pontos',
    icon: '👑',
    unlocked: false,
  },
]

const ProgressContext = createContext<ProgressContextType | undefined>(
  undefined,
)

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [logs, setLogs] = useState<MealLog[]>(() => {
    const saved = localStorage.getItem('pa-user-logs')
    return saved ? JSON.parse(saved) : []
  })

  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('pa-user-stats')
    return saved ? JSON.parse(saved) : INITIAL_STATS
  })

  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem('pa-user-badges')
    return saved ? JSON.parse(saved) : INITIAL_BADGES
  })

  useEffect(() => {
    localStorage.setItem('pa-user-logs', JSON.stringify(logs))
    localStorage.setItem('pa-user-stats', JSON.stringify(stats))
    localStorage.setItem('pa-user-badges', JSON.stringify(badges))
  }, [logs, stats, badges])

  const addLog = (log: MealLog) => {
    const newLogs = [log, ...logs]
    setLogs(newLogs)

    // Update Stats
    let newPoints = stats.totalPoints + log.score

    // Calculate Streak
    // This is a simplified streak calculation
    const today = new Date()
    const lastLog = logs.length > 0 ? logs[0] : null
    let newCurrentStreak = stats.currentStreak

    if (!lastLog) {
      newCurrentStreak = 1
    } else {
      const lastDate = parseISO(lastLog.date)
      const diff = differenceInDays(today, lastDate)
      if (diff === 0) {
        // Same day, streak doesn't change unless it was 0
        if (newCurrentStreak === 0) newCurrentStreak = 1
      } else if (diff === 1) {
        newCurrentStreak += 1
      } else {
        newCurrentStreak = 1
      }
    }

    const newBestStreak = Math.max(newCurrentStreak, stats.bestStreak)

    setStats({
      totalPoints: newPoints,
      totalLogs: stats.totalLogs + 1,
      currentStreak: newCurrentStreak,
      bestStreak: newBestStreak,
    })

    // Check Badges
    const newBadges = [...badges]
    let badgeUnlocked = false

    if (!badges.find((b) => b.id === 'first-meal')?.unlocked) {
      const badgeIndex = newBadges.findIndex((b) => b.id === 'first-meal')
      if (badgeIndex !== -1) {
        newBadges[badgeIndex].unlocked = true
        badgeUnlocked = true
        toast({
          title: 'Nova Conquista!',
          description: 'Você desbloqueou: Primeiro Passo',
        })
      }
    }

    if (newPoints >= 1000 && !badges.find((b) => b.id === 'master')?.unlocked) {
      const badgeIndex = newBadges.findIndex((b) => b.id === 'master')
      if (badgeIndex !== -1) {
        newBadges[badgeIndex].unlocked = true
        badgeUnlocked = true
        toast({
          title: 'Nova Conquista!',
          description: 'Você desbloqueou: Mestre da Dieta',
        })
      }
    }

    // Simple logic for streak badge
    if (
      newCurrentStreak >= 3 &&
      !badges.find((b) => b.id === 'streak-3')?.unlocked
    ) {
      const badgeIndex = newBadges.findIndex((b) => b.id === 'streak-3')
      if (badgeIndex !== -1) {
        newBadges[badgeIndex].unlocked = true
        badgeUnlocked = true
        toast({
          title: 'Nova Conquista!',
          description: 'Você desbloqueou: Consistência',
        })
      }
    }

    if (badgeUnlocked) {
      setBadges(newBadges)
    }
  }

  const clearData = () => {
    setLogs([])
    setStats(INITIAL_STATS)
    setBadges(INITIAL_BADGES)
    localStorage.removeItem('pa-user-logs')
    localStorage.removeItem('pa-user-stats')
    localStorage.removeItem('pa-user-badges')
    toast({
      title: 'Dados limpos',
      description: 'Seu progresso foi reiniciado.',
    })
  }

  return React.createElement(
    ProgressContext.Provider,
    {
      value: { logs, stats, badges, addLog, clearData },
    },
    children,
  )
}

export default function useProgressStore() {
  const context = useContext(ProgressContext)
  if (context === undefined) {
    throw new Error('useProgressStore must be used within a ProgressProvider')
  }
  return context
}
