import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import usePlanStore from '@/stores/usePlanStore'
import useProgressStore from '@/stores/useProgressStore'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Camera,
  Check,
  Loader2,
  X,
  Plus,
  Image as ImageIcon,
} from 'lucide-react'
import { MealLog } from '@/lib/types'
import { cn } from '@/lib/utils'

const DAYS = [
  { id: 'monday', label: 'Segunda-feira' },
  { id: 'tuesday', label: 'Terça-feira' },
  { id: 'wednesday', label: 'Quarta-feira' },
  { id: 'thursday', label: 'Quinta-feira' },
  { id: 'friday', label: 'Sexta-feira' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' },
]

const getTodayKey = () => {
  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ]
  return days[new Date().getDay()]
}

export default function LogMeal() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preSelectedMealId = searchParams.get('mealId')

  const { plan, hasPlan } = usePlanStore()
  const { addLog } = useProgressStore()

  // States
  const [selectedDay, setSelectedDay] = useState<string>(getTodayKey())
  const [selectedMealId, setSelectedMealId] = useState<string>(
    preSelectedMealId || '',
  )
  const [photos, setPhotos] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState('')
  const [extraItems, setExtraItems] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Derived
  const currentDayPlan = plan[selectedDay]
  const availableMeals = currentDayPlan?.meals || []
  const selectedMeal = availableMeals.find((m) => m.id === selectedMealId)

  // Pre-select logic - runs once or when params change
  useEffect(() => {
    if (preSelectedMealId) {
      // Check if the preselected meal exists in the current day (default today)
      const existsInCurrent = plan[selectedDay]?.meals.some(
        (m) => m.id === preSelectedMealId,
      )
      if (existsInCurrent) {
        setSelectedMealId(preSelectedMealId)
      }
    }
  }, [preSelectedMealId, plan, selectedDay])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setIsUploading(true)

      const newPhotos: string[] = []
      const promises = Array.from(files).map((file) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (reader.result) newPhotos.push(reader.result as string)
            resolve()
          }
          reader.readAsDataURL(file)
        })
      })

      // Simulate a minimum delay for the animation to be perceivable
      await Promise.all([
        ...promises,
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ])

      setPhotos((prev) => [...prev, ...newPhotos])
      setIsUploading(false)

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleItem = (itemId: string) => {
    const newSet = new Set(checkedItems)
    if (newSet.has(itemId)) {
      newSet.delete(itemId)
    } else {
      newSet.add(itemId)
    }
    setCheckedItems(newSet)
  }

  const handleSubmit = () => {
    if (!selectedMeal) return

    const totalItems = selectedMeal.items.length
    const checkedCount = checkedItems.size

    // Simple scoring logic
    let rawScore = totalItems > 0 ? (checkedCount / totalItems) * 100 : 100

    // Penalty for extra items
    const extraCount = extraItems.trim() ? extraItems.split(',').length : 0
    rawScore = Math.max(0, rawScore - extraCount * 10)

    // Reward for photos
    if (photos.length > 0) rawScore = Math.min(100, rawScore + 5)

    const log: MealLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mealId: selectedMeal.id,
      mealName: selectedMeal.name,
      score: Math.round(rawScore),
      itemsEaten: Array.from(checkedItems),
      photoUrl: photos[0] || undefined, // Keep primary photo for backward compat
      photos: photos,
      feedback: feedback + (extraItems ? ` (Extras: ${extraItems})` : ''),
    }

    addLog(log)
    navigate('/feedback', {
      state: { score: log.score, mealName: selectedMeal.name },
    })
  }

  if (!hasPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center px-4">
        <div className="bg-muted p-4 rounded-full">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin-slow" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Nenhum plano encontrado</h2>
          <p className="text-muted-foreground">
            Configure seu plano alimentar primeiro para começar a registrar.
          </p>
        </div>
        <Button onClick={() => navigate('/plan')}>Configurar Plano</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Registrar Refeição</h1>
        <p className="text-muted-foreground">
          Acompanhe sua dieta e receba feedback.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Refeição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Day & Meal Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.id} value={day.id}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Refeição</Label>
              <Select
                value={selectedMealId}
                onValueChange={setSelectedMealId}
                disabled={availableMeals.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      availableMeals.length === 0
                        ? 'Sem refeições neste dia'
                        : 'Escolha uma refeição...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableMeals.map((meal) => (
                    <SelectItem key={meal.id} value={meal.id}>
                      {meal.name} ({meal.time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Fotos do Prato</Label>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 text-muted-foreground transition-colors relative overflow-hidden bg-muted/5',
                isUploading
                  ? 'bg-muted/20'
                  : 'hover:bg-muted/10 cursor-pointer',
              )}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 animate-fade-in">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    Enviando fotos...
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-background rounded-full shadow-sm">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Clique para adicionar fotos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tire uma foto ou selecione da galeria
                    </p>
                  </div>
                </>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={isUploading}
              />
            </div>

            {/* Uploaded Photos Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 animate-fade-in-up">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-md overflow-hidden border bg-background group"
                  >
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div
                  className="flex items-center justify-center aspect-square rounded-md border border-dashed hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">Adicionar</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedMeal && (
            <div className="space-y-6 animate-fade-in-up pt-4 border-t">
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  O que você comeu do plano?
                </Label>
                {selectedMeal.items.length > 0 ? (
                  <div className="grid gap-2">
                    {selectedMeal.items.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center space-x-3 p-3 border rounded-lg transition-all cursor-pointer active:scale-[0.99]',
                          checkedItems.has(item.id)
                            ? 'bg-primary/5 border-primary/30'
                            : 'hover:bg-muted/50',
                        )}
                        onClick={() => toggleItem(item.id)}
                      >
                        <Checkbox
                          checked={checkedItems.has(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <span
                          className={cn(
                            'text-sm font-medium flex-1 select-none',
                            checkedItems.has(item.id)
                              ? 'text-primary'
                              : 'text-foreground',
                          )}
                        >
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Esta refeição não possui itens cadastrados no plano.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Comeu algo fora do plano?</Label>
                <Input
                  placeholder="Ex: 2 bombons, 1 fatia de bolo..."
                  value={extraItems}
                  onChange={(e) => setExtraItems(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Como você se sentiu?</Label>
                <Textarea
                  placeholder="Registre suas observações, fome, saciedade..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="resize-none"
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full text-lg py-6 font-semibold shadow-lg hover:shadow-xl transition-all"
            disabled={!selectedMeal || isUploading}
            onClick={handleSubmit}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" /> Avaliar Refeição
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
