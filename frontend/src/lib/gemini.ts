import { WeekPlan, Meal, MealAnalysis } from '@/lib/types'

type GeminiDietPlan = {
  diet: Record<string, GeminiMeal[]>
}

type GeminiMeal = {
  time: string
  name: string
  options: string[][]
}

type GeminiResult = {
  raw: GeminiDietPlan
  weekPlan: WeekPlan
}

const DAY_MAPPING: Record<string, string> = {
  Seg: 'monday',
  Ter: 'tuesday',
  Qua: 'wednesday',
  Qui: 'thursday',
  Sex: 'friday',
  Sab: 'saturday',
  Dom: 'sunday',
}

export const RAW_PLAN_STORAGE_KEY = 'pa-user-dietplan-raw'

const sanitizeResponseText = (content?: string): string => {
  if (!content) return ''

  let sanitized = content.trim()
  if (sanitized.startsWith('```')) {
    sanitized = sanitized.replace(/```json|```/g, '').trim()
  }

  return sanitized
}

const convertDietPlanToWeekPlan = (dietPlan: GeminiDietPlan): WeekPlan => {
  const plan: WeekPlan = {}

  Object.entries(DAY_MAPPING).forEach(([label, key]) => {
    const meals = dietPlan.diet?.[label] ?? []
    plan[key] = {
      day: key,
      meals: meals.map((meal, mealIndex) => ({
        id: `${key}-meal-${mealIndex}`,
        name: meal.name || meal.time || 'Refeição',
        time: meal.time || '',
        items: (meal.options || []).map((option, optionIndex) => ({
          id: `${key}-meal-${mealIndex}-option-${optionIndex}`,
          name: option.filter(Boolean).join(' • '),
        })),
      })),
    }
  })

  return plan
}

type InterpretMealPhotosArgs = {
  photos: string[]
  dayLabel: string
  meal: Meal
}

const formatMealPlanForPrompt = (meal: Meal) => {
  return JSON.stringify(
    {
      id: meal.id,
      nome: meal.name,
      horario: meal.time,
      itens: meal.items.map((item) => item.name),
    },
    null,
    2,
  )
}

// Helper para converter DataURL (base64) para Blob para envio via FormData
const dataURLtoBlob = (dataurl: string) => {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function interpretDietPlan(file: File): Promise<GeminiResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/api/v1/interpret-plan`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Falha ao processar o plano alimentar no servidor.')
  }

  const parsed = await response.json()

  localStorage.setItem(RAW_PLAN_STORAGE_KEY, JSON.stringify(parsed))
  const weekPlan = convertDietPlanToWeekPlan(parsed)
  return { raw: parsed, weekPlan }
}

export const getStoredRawPlan = (): GeminiDietPlan | null => {
  const stored = localStorage.getItem(RAW_PLAN_STORAGE_KEY)
  return stored ? (JSON.parse(stored) as GeminiDietPlan) : null
}

const normalizeAnalysis = (analysis: any): MealAnalysis => {
  return {
    aderencia: analysis?.aderencia || 'Indefinido',
    percentual: Number(analysis?.percentual) || 0,
    pontuacao: Number(analysis?.pontuacao) || 0,
    descricao: analysis?.descricao || '',
    nutrientes_estimados: {
      calorias: Number(analysis?.nutrientes_estimados?.calorias) || 0,
      proteinas: Number(analysis?.nutrientes_estimados?.proteinas) || 0,
      carboidratos: Number(analysis?.nutrientes_estimados?.carboidratos) || 0,
      gorduras: Number(analysis?.nutrientes_estimados?.gorduras) || 0,
    },
  }
}

export async function interpretMealPhotos({
  photos,
  dayLabel,
  meal,
}: InterpretMealPhotosArgs): Promise<MealAnalysis> {
  if (!photos || photos.length === 0) {
    throw new Error('Adicione ao menos uma foto para avaliar a refeição.')
  }

  const formData = new FormData()
  formData.append('day_label', dayLabel)
  formData.append('meal_name', meal.name)
  formData.append('meal_plan_json', formatMealPlanForPrompt(meal))

  // Converter fotos base64 para Blob e adicionar ao FormData
  photos.forEach((photo, index) => {
    const blob = dataURLtoBlob(photo)
    formData.append('photos', blob, `photo_${index}.jpg`)
  })

  const response = await fetch(`${API_URL}/api/v1/analyze-meal`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Falha ao analisar a refeição no servidor.')
  }

  const parsed = await response.json()
  return normalizeAnalysis(parsed)
}
