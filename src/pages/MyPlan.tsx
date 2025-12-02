import { useState } from 'react'
import usePlanStore from '@/stores/usePlanStore'
import { DEFAULT_PLAN, DayPlan, Meal } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Trash2, Save, Download } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function MyPlan() {
  const { plan, hasPlan, savePlan, resetPlan } = usePlanStore()
  const [activeTab, setActiveTab] = useState('monday')
  const [isEditing, setIsEditing] = useState(false)

  // Local state for editing to avoid frequent context updates
  const [localPlan, setLocalPlan] = useState(hasPlan ? plan : DEFAULT_PLAN)

  const handleSave = () => {
    savePlan(localPlan)
    setIsEditing(false)
  }

  const handleImportTemplate = () => {
    setLocalPlan(DEFAULT_PLAN)
    savePlan(DEFAULT_PLAN)
    toast({
      title: 'Modelo importado',
      description: 'Você pode editar este plano conforme necessário.',
    })
  }

  const addItem = (day: string, mealIndex: number) => {
    const newPlan = { ...localPlan }
    newPlan[day].meals[mealIndex].items.push({
      id: crypto.randomUUID(),
      name: 'Novo item',
    })
    setLocalPlan(newPlan)
  }

  const updateItemName = (
    day: string,
    mealIndex: number,
    itemIndex: number,
    name: string,
  ) => {
    const newPlan = { ...localPlan }
    newPlan[day].meals[mealIndex].items[itemIndex].name = name
    setLocalPlan(newPlan)
  }

  const removeItem = (day: string, mealIndex: number, itemIndex: number) => {
    const newPlan = { ...localPlan }
    newPlan[day].meals[mealIndex].items.splice(itemIndex, 1)
    setLocalPlan(newPlan)
  }

  const exportData = () => {
    const dataStr = JSON.stringify(localPlan, null, 2)
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = 'meu-plano-alimentar.json'
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const days = [
    { id: 'monday', label: 'Seg' },
    { id: 'tuesday', label: 'Ter' },
    { id: 'wednesday', label: 'Qua' },
    { id: 'thursday', label: 'Qui' },
    { id: 'friday', label: 'Sex' },
    { id: 'saturday', label: 'Sáb' },
    { id: 'sunday', label: 'Dom' },
  ]

  if (!hasPlan && !isEditing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <h2 className="text-3xl font-bold">Você ainda não tem um plano.</h2>
        <p className="text-muted-foreground max-w-md">
          Para começar, você pode importar um modelo padrão e personalizá-lo, ou
          criar um do zero.
        </p>
        <div className="flex gap-4">
          <Button onClick={handleImportTemplate}>Usar Modelo Padrão</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meu Plano Alimentar</h1>
          <p className="text-muted-foreground">
            Gerencie suas refeições semanais.
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={exportData}>
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
              <Button onClick={() => setIsEditing(true)}>Editar Plano</Button>
            </>
          ) : (
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="mr-2 h-4 w-4" /> Salvar Alterações
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 h-auto">
          {days.map((day) => (
            <TabsTrigger
              key={day.id}
              value={day.id}
              className="text-xs sm:text-sm py-2"
            >
              {day.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((day) => (
          <TabsContent key={day.id} value={day.id} className="mt-6 space-y-4">
            {localPlan[day.id]?.meals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nenhuma refeição planejada para este dia.
                  {isEditing && (
                    <p className="text-sm mt-2">
                      (Funcionalidade de adicionar refeição completa viria aqui)
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              localPlan[day.id]?.meals.map((meal, mealIndex) => (
                <Card key={meal.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{meal.name}</CardTitle>
                      <span className="font-mono text-sm bg-background px-2 py-1 rounded border">
                        {meal.time}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {meal.items.map((item, itemIndex) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary/60" />
                          {isEditing ? (
                            <div className="flex flex-1 gap-2">
                              <Input
                                value={item.name}
                                onChange={(e) =>
                                  updateItemName(
                                    day.id,
                                    mealIndex,
                                    itemIndex,
                                    e.target.value,
                                  )
                                }
                                className="h-8"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() =>
                                  removeItem(day.id, mealIndex, itemIndex)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm">{item.name}</span>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-primary"
                          onClick={() => addItem(day.id, mealIndex)}
                        >
                          <Plus className="mr-2 h-3 w-3" /> Adicionar Item
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="pt-8 border-t">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Apagar Plano Atual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tem certeza?</DialogTitle>
              <DialogDescription>
                Isso apagará permanentemente seu plano alimentar atual. Esta
                ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">Cancelar</Button>
              <Button variant="destructive" onClick={resetPlan}>
                Sim, apagar tudo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
