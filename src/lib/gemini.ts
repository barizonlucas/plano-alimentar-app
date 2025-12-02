import prompt from '@/samples/prompt_dietplan_interpret.txt?raw'
import { WeekPlan } from '@/lib/types'

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

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

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

const fileToBase64 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function interpretDietPlan(
  file: File,
): Promise<GeminiResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'Gemini API key não configurada. Defina VITE_GEMINI_API_KEY.',
    )
  }

  const base64File = await fileToBase64(file)

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: file.type || 'application/pdf',
              data: base64File,
            },
          },
        ],
      },
    ],
  }

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('Falha ao comunicar com o Gemini.')
  }

  const data = await response.json()
  const textContent: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text)
    .filter(Boolean)
    .join('\n')

  const cleaned = sanitizeResponseText(textContent)
  if (!cleaned) {
    throw new Error('Resposta vazia do Gemini.')
  }

  let parsed: GeminiDietPlan

  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Não foi possível interpretar o JSON retornado pelo Gemini.')
  }

  localStorage.setItem(RAW_PLAN_STORAGE_KEY, JSON.stringify(parsed))

  const weekPlan = convertDietPlanToWeekPlan(parsed)

  return { raw: parsed, weekPlan }
}

export const getStoredRawPlan = (): GeminiDietPlan | null => {
  const stored = localStorage.getItem(RAW_PLAN_STORAGE_KEY)
  return stored ? (JSON.parse(stored) as GeminiDietPlan) : null
}
