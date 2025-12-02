import { useState, useEffect } from 'react'
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
import { Camera, Upload, Check } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Meal, MealLog } from '@/lib/types'

export default function LogMeal() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preSelectedMealId = searchParams.get('mealId')

  const { getTodayPlan } = usePlanStore()
  const { addLog } = useProgressStore()

  const todayPlan = getTodayPlan()

  const [selectedMealId, setSelectedMealId] = useState<string>(
    preSelectedMealId || '',
  )
  const [photo, setPhoto] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState('')
  const [extraItems, setExtraItems] = useState('')

  const selectedMeal = todayPlan.meals.find((m) => m.id === selectedMealId)

  // Pre-select logic
  useEffect(() => {
    if (
      preSelectedMealId &&
      todayPlan.meals.some((m) => m.id === preSelectedMealId)
    ) {
      setSelectedMealId(preSelectedMealId)
    }
  }, [preSelectedMealId, todayPlan])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
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
    // Base: Percentage of planned items eaten
    let rawScore = totalItems > 0 ? (checkedCount / totalItems) * 100 : 100

    // Penalty for extra items (arbitrary -5 per extra item distinct by comma)
    const extraCount = extraItems.trim() ? extraItems.split(',').length : 0
    rawScore = Math.max(0, rawScore - extraCount * 10)

    // Reward for photo
    if (photo) rawScore = Math.min(100, rawScore + 5)

    const log: MealLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mealId: selectedMeal.id,
      mealName: selectedMeal.name,
      score: Math.round(rawScore),
      itemsEaten: Array.from(checkedItems),
      photoUrl: photo || undefined,
      feedback: feedback + (extraItems ? ` (Extras: ${extraItems})` : ''),
    }

    addLog(log)
    navigate('/feedback', {
      state: { score: log.score, mealName: selectedMeal.name },
    })
  }

  if (todayPlan.meals.length === 0) {
    return (
      <div className="text-center py-10">
        Não há refeições planejadas para hoje. Configure seu plano primeiro.
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Registrar Refeição</h1>
        <p className="text-muted-foreground">O que você comeu hoje?</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Refeição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Selecione a Refeição</Label>
            <Select value={selectedMealId} onValueChange={setSelectedMealId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma refeição..." />
              </SelectTrigger>
              <SelectContent>
                {todayPlan.meals.map((meal) => (
                  <SelectItem key={meal.id} value={meal.id}>
                    {meal.name} ({meal.time})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Foto do Prato (Opcional)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/10 hover:bg-muted/20 transition-colors relative overflow-hidden">
              {photo ? (
                <div className="relative w-full h-48">
                  <img
                    src={photo}
                    alt="Meal preview"
                    className="w-full h-full object-cover rounded-md"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => setPhoto(null)}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <>
                  <Camera className="h-10 w-10" />
                  <p className="text-sm">
                    Clique para selecionar ou tire uma foto
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handlePhotoUpload}
                  />
                </>
              )}
            </div>
          </div>

          {selectedMeal && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="space-y-2">
                <Label className="text-base">O que você comeu do plano?</Label>
                <div className="grid gap-2">
                  {selectedMeal.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => toggleItem(item.id)}
                    >
                      <Checkbox
                        checked={checkedItems.has(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1">
                        {item.name}
                      </label>
                    </div>
                  ))}
                </div>
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
                <Label>Observações</Label>
                <Textarea
                  placeholder="Como você se sentiu? Estava com muita fome?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full text-lg py-6"
            disabled={!selectedMeal}
            onClick={handleSubmit}
          >
            <Check className="mr-2 h-5 w-5" /> Avaliar Refeição
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
