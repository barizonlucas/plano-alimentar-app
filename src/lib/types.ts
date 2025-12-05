export type MealItem = {
  id: string
  name: string
  checked?: boolean // Helper for UI
}

export type Meal = {
  id: string
  name: string // e.g., "Café da Manhã"
  time: string // "08:00"
  items: MealItem[]
}

export type DayPlan = {
  day: string // "monday", "tuesday", ...
  meals: Meal[]
}

export type WeekPlan = {
  [key: string]: DayPlan
}

export type MealLog = {
  id: string
  date: string // ISO Date string
  mealId: string
  mealName: string
  score: number
  itemsEaten: string[]
  photoUrl?: string // Primary photo for backward compatibility
  photos?: string[] // Support for multiple photos
  feedback: string
}

export type Badge = {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
}

export type UserStats = {
  totalPoints: number
  currentStreak: number
  bestStreak: number
  totalLogs: number
}

export const DEFAULT_PLAN: WeekPlan = {
  monday: {
    day: 'monday',
    meals: [
      {
        id: 'm1',
        name: 'Café da Manhã',
        time: '07:00',
        items: [
          { id: 'i1', name: '2 Ovos mexidos' },
          { id: 'i2', name: '1 fatia de pão integral' },
          { id: 'i3', name: 'Café preto sem açúcar' },
        ],
      },
      {
        id: 'm2',
        name: 'Almoço',
        time: '12:00',
        items: [
          { id: 'i4', name: '100g Frango grelhado' },
          { id: 'i5', name: 'Salada verde à vontade' },
          { id: 'i6', name: '2 colheres de arroz integral' },
        ],
      },
      {
        id: 'm3',
        name: 'Jantar',
        time: '19:00',
        items: [
          { id: 'i7', name: 'Sopa de legumes' },
          { id: 'i8', name: '1 fruta cítrica' },
        ],
      },
    ],
  },
  tuesday: { day: 'tuesday', meals: [] },
  wednesday: { day: 'wednesday', meals: [] },
  thursday: { day: 'thursday', meals: [] },
  friday: { day: 'friday', meals: [] },
  saturday: { day: 'saturday', meals: [] },
  sunday: { day: 'sunday', meals: [] },
}
