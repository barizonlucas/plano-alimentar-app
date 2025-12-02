import React, { createContext, useContext, useEffect, useState } from 'react'
import { WeekPlan, DEFAULT_PLAN, DayPlan, Meal } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

interface PlanContextType {
  plan: WeekPlan
  hasPlan: boolean
  savePlan: (newPlan: WeekPlan) => void
  updateDayPlan: (day: string, dayPlan: DayPlan) => void
  resetPlan: () => void
  getTodayPlan: () => DayPlan
}

const PlanContext = createContext<PlanContextType | undefined>(undefined)

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [plan, setPlan] = useState<WeekPlan>(() => {
    const saved = localStorage.getItem('pa-user-plan')
    return saved ? JSON.parse(saved) : {}
  })

  const [hasPlan, setHasPlan] = useState<boolean>(false)

  useEffect(() => {
    const saved = localStorage.getItem('pa-user-plan')
    setHasPlan(!!saved && Object.keys(JSON.parse(saved)).length > 0)
  }, [plan])

  const savePlan = (newPlan: WeekPlan) => {
    setPlan(newPlan)
    localStorage.setItem('pa-user-plan', JSON.stringify(newPlan))
    toast({
      title: 'Plano salvo!',
      description: 'Seu plano alimentar foi atualizado com sucesso.',
    })
  }

  const updateDayPlan = (day: string, dayPlan: DayPlan) => {
    const newPlan = { ...plan, [day]: dayPlan }
    savePlan(newPlan)
  }

  const resetPlan = () => {
    setPlan({})
    localStorage.removeItem('pa-user-plan')
    setHasPlan(false)
    toast({
      title: 'Plano removido',
      description: 'Todos os dados do plano foram apagados.',
      variant: 'destructive',
    })
  }

  const getTodayPlan = (): DayPlan => {
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ]
    const todayKey = days[new Date().getDay()]

    if (!plan[todayKey] && hasPlan) {
      // Fallback to monday or empty if today not defined but plan exists
      return plan['monday'] || { day: todayKey, meals: [] }
    }

    return plan[todayKey] || { day: todayKey, meals: [] }
  }

  return React.createElement(
    PlanContext.Provider,
    {
      value: {
        plan,
        hasPlan,
        savePlan,
        updateDayPlan,
        resetPlan,
        getTodayPlan,
      },
    },
    children,
  )
}

export default function usePlanStore() {
  const context = useContext(PlanContext)
  if (context === undefined) {
    throw new Error('usePlanStore must be used within a PlanProvider')
  }
  return context
}
