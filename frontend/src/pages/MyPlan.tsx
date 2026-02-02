import { useState, useRef, useEffect } from 'react'
import usePlanStore from '@/stores/usePlanStore'
import { DEFAULT_PLAN, WeekPlan } from '@/lib/types'
import { interpretDietPlan } from '@/lib/gemini'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  FileText,
  Loader2,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const formatMealItemText = (text: string): string => {
  if (!text) {
    return ''
  }

  return text
    .split('•')
    .map((part) => part.trim())
    .filter(Boolean)
    .join('\n')
}

export default function MyPlan() {
  const { plan, hasPlan, savePlan, resetPlan } = usePlanStore()
  const [activeTab, setActiveTab] = useState('monday')
  const [isEditing, setIsEditing] = useState(false)

  // Upload states
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local state for editing to avoid frequent context updates
  const [localPlan, setLocalPlan] = useState<WeekPlan>(hasPlan ? plan : {})

  // Sync local plan when store plan changes (e.g. after upload)
  useEffect(() => {
    if (hasPlan) {
      setLocalPlan(plan)
    }
  }, [plan, hasPlan])

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

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo PDF.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 300)

    try {
      const { weekPlan } = await interpretDietPlan(file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Small delay to show 100%
      setTimeout(() => {
        setIsUploading(false)
        savePlan(weekPlan)
        toast({
          title: 'Upload concluído!',
          description:
            'Seu plano alimentar foi interpretado pelo Gemini e salvo.',
        })
      }, 500)
    } catch (error) {
      clearInterval(progressInterval)
      setIsUploading(false)
      toast({
        title: 'Erro no upload',
        description:
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro ao processar seu arquivo. Tente novamente.',
        variant: 'destructive',
      })
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center px-4 animate-fade-in">
        <div className="rounded-full bg-primary/10 p-6">
          {isUploading ? (
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          ) : (
            <FileText className="h-12 w-12 text-primary" />
          )}
        </div>

        <div className="max-w-md space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {isUploading ? 'Processando seu plano...' : 'Vamos começar?'}
          </h2>
          <p className="text-muted-foreground">
            {isUploading
              ? 'Estamos lendo e organizando seu plano alimentar. Isso pode levar alguns segundos.'
              : 'Carregue o PDF enviado pelo seu nutricionista para importarmos automaticamente suas refeições.'}
          </p>
        </div>

        {isUploading ? (
          <div className="w-full max-w-xs space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground font-mono">
              {uploadProgress}% concluído
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <Input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button
              size="lg"
              className="w-full gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={handleFileSelect}
            >
              <Upload className="h-5 w-5" />
              Carregar seu Plano Alimentar
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou se preferir
                </span>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={handleImportTemplate}>
              Usar Modelo Padrão (Teste)
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meu Plano Alimentar</h1>
          <p className="text-muted-foreground">
            Gerencie suas refeições semanais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={exportData} size="sm">
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
              {/* Hidden input for re-upload if needed, though button not explicitly requested for this view */}
              <Button onClick={() => setIsEditing(true)} size="sm">
                Editar Plano
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
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
          <TabsContent
            key={day.id}
            value={day.id}
            className="mt-6 space-y-4 focus-visible:ring-0"
          >
            {localPlan[day.id]?.meals.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
                  <p>Nenhuma refeição planejada para este dia.</p>
                  {isEditing && (
                    <Button variant="link" className="mt-2">
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Refeição
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              localPlan[day.id]?.meals.map((meal, mealIndex) => (
                <Card
                  key={meal.id}
                  className="overflow-hidden border-l-4 border-l-primary"
                >
                  <CardHeader className="bg-muted/30 py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {meal.name}
                      </CardTitle>
                      <span className="font-mono text-sm bg-background px-2 py-1 rounded border text-muted-foreground">
                        {meal.time}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {meal.items.map((item, itemIndex) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 group"
                        >
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-primary/60 shrink-0" />
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
                                className="h-8 text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  removeItem(day.id, mealIndex, itemIndex)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                              {formatMealItemText(item.name)}
                            </span>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-primary hover:bg-primary/10 -ml-2"
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
            <Button
              variant="destructive"
              size="sm"
              className="opacity-80 hover:opacity-100"
            >
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
