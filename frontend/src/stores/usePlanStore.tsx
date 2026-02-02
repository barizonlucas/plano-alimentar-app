import React, { createContext, useContext, useEffect, useState } from 'react'
import { WeekPlan, DayPlan } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

interface PlanContextType {
  plan: WeekPlan
  hasPlan: boolean
  isLoading: boolean
  error: string | null
  savePlan: (newPlan: WeekPlan) => void
  updateDayPlan: (day: string, dayPlan: DayPlan) => void
  resetPlan: () => void
  getTodayPlan: () => DayPlan
}

const PlanContext = createContext<PlanContextType | undefined>(undefined)

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [plan, setPlan] = useState<WeekPlan>({})
  const [hasPlan, setHasPlan] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const loadPlan = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_URL}/api/plans/current`)
        if (response.ok) {
          const data = await response.json()
          const planData = data.content || data
          if (planData && Object.keys(planData).length > 0) {
            setPlan(planData)
            setHasPlan(true)
          }
        }
      } catch (err) {
        console.error('Failed to load plan', err)
        setError('Erro ao carregar o plano do servidor.')
      } finally {
        setIsLoading(false)
      }
    }
    loadPlan()
  }, [API_URL])

  const savePlan = async (newPlan: WeekPlan) => {
    setPlan(newPlan)
    setHasPlan(Object.keys(newPlan).length > 0)

    try {
      const response = await fetch(`${API_URL}/api/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPlan),
      })

      if (!response.ok) {
        throw new Error('Failed to save plan')
      }

      toast({
        title: 'Plano salvo!',
        description: 'Seu plano alimentar foi atualizado com sucesso.',
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as alterações no servidor.',
        variant: 'destructive',
      })
    }
  }

  const updateDayPlan = (day: string, dayPlan: DayPlan) => {
    const newPlan = { ...plan, [day]: dayPlan }
    savePlan(newPlan)
  }

  const resetPlan = () => {
    setPlan({})
    setHasPlan(false)
    savePlan({})
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
        isLoading,
        error,
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
