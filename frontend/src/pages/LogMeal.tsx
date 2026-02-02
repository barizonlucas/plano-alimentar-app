import { useState, useEffect, useRef, useCallback } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Camera,
  Check,
  Loader2,
  X,
  Plus,
  Image as ImageIcon,
} from 'lucide-react'
import { MealLog } from '@/lib/types'
import { interpretMealPhotos } from '@/lib/gemini'
import { toast } from '@/components/ui/use-toast'
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
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedCameraPhotos, setCapturedCameraPhotos] = useState<string[]>([])
  const [cameraError, setCameraError] = useState('')

  const galleryInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const stopCameraStream = useCallback(() => {
    setCameraStream((prev) => {
      if (prev) {
        prev.getTracks().forEach((track) => track.stop())
      }
      return null
    })
  }, [])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream || null
    }
  }, [cameraStream])

  useEffect(() => {
    return () => {
      stopCameraStream()
    }
  }, [stopCameraStream])

  const closeCameraCapture = useCallback(() => {
    stopCameraStream()
    setCapturedCameraPhotos([])
    setIsCameraCaptureOpen(false)
  }, [stopCameraStream])

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
      if (galleryInputRef.current) galleryInputRef.current.value = ''
      e.target.value = ''
    }
  }

  const startCameraCapture = async () => {
    setCameraError('')
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCameraError(
        'Seu dispositivo não permite acesso à câmera. Escolha fotos na galeria.',
      )
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      setCapturedCameraPhotos([])
      setCameraStream(stream)
      setIsCameraCaptureOpen(true)
      setIsPhotoDialogOpen(false)
    } catch (error) {
      console.error('Erro ao acessar câmera', error)
      setCameraError(
        'Não conseguimos acessar sua câmera. Permita o acesso ou selecione fotos na galeria.',
      )
    }
  }

  const handleCapturePhoto = () => {
    if (!videoRef.current || capturedCameraPhotos.length >= 3) return
    const video = videoRef.current
    const width = video.videoWidth
    const height = video.videoHeight

    if (!width || !height) return

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return

    context.drawImage(video, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedCameraPhotos((prev) => {
      if (prev.length >= 3) return prev
      return [...prev, dataUrl]
    })
  }

  const handleConfirmCameraPhotos = () => {
    if (capturedCameraPhotos.length === 0) return
    setPhotos((prev) => [...prev, ...capturedCameraPhotos])
    closeCameraCapture()
  }

  const openPhotoSelector = () => {
    if (!isUploading) {
      setIsPhotoDialogOpen(true)
    }
  }

  const handlePhotoSourceSelection = (source: 'camera' | 'gallery') => {
    if (isUploading) return

    if (source === 'camera') {
      startCameraCapture()
      return
    }

    setIsPhotoDialogOpen(false)
    setTimeout(() => galleryInputRef.current?.click(), 0)
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!selectedMeal) return
    if (photos.length === 0) {
      toast({
        title: 'Adicione fotos do prato',
        description: 'Capture ou selecione ao menos uma foto para avaliar.',
        variant: 'destructive',
      })
      return
    }

    const dayLabel =
      DAYS.find((day) => day.id === selectedDay)?.label || selectedDay

    setIsEvaluating(true)

    try {
      const analysis = await interpretMealPhotos({
        photos,
        dayLabel,
        meal: selectedMeal,
      })

      const computedScore = Math.round(
        Math.min(Math.max(analysis.percentual, 0), 100),
      )

      const log: MealLog = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        mealId: selectedMeal.id,
        mealName: selectedMeal.name,
        score: computedScore,
        itemsEaten: [],
        feedback: '',
        analysis,
      }

      addLog(log)
      navigate('/feedback', {
        state: {
          score: log.score,
          mealName: selectedMeal.name,
          analysis,
        },
      })
      setPhotos([])
      setCapturedCameraPhotos([])
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao avaliar refeição',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível interpretar as fotos agora.',
        variant: 'destructive',
      })
    } finally {
      setIsEvaluating(false)
    }
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
            <Dialog
              open={isPhotoDialogOpen}
              onOpenChange={(open) => {
                if (isUploading && open) return
                setIsPhotoDialogOpen(open)
              }}
            >
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 text-muted-foreground transition-colors relative overflow-hidden bg-muted/5',
                  isUploading
                    ? 'bg-muted/20'
                    : 'hover:bg-muted/10 cursor-pointer',
                )}
                onClick={openPhotoSelector}
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
              </div>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar fotos</DialogTitle>
                  <DialogDescription>
                    Escolha se deseja tirar novas fotos ou selecionar da galeria do
                    dispositivo.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <Button
                    variant="secondary"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => handlePhotoSourceSelection('camera')}
                    disabled={isUploading}
                  >
                    <Camera className="h-5 w-5 text-primary" />
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium">Tirar foto agora</span>
                      <span className="text-xs text-muted-foreground">
                        Use a câmera do dispositivo para capturar
                      </span>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => handlePhotoSourceSelection('gallery')}
                    disabled={isUploading}
                  >
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium">Escolher da galeria</span>
                      <span className="text-xs text-muted-foreground">
                        Selecione uma ou mais fotos existentes
                      </span>
                    </div>
                  </Button>
                </div>
                {cameraError && (
                  <p className="text-xs text-destructive text-center mt-2">
                    {cameraError}
                  </p>
                )}
              </DialogContent>
            </Dialog>

            <Dialog
              open={isCameraCaptureOpen}
              onOpenChange={(open) => {
                if (!open) closeCameraCapture()
              }}
            >
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Tire suas fotos</DialogTitle>
                  <DialogDescription>
                    Capture até 3 fotos em sequência antes de enviar.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    {cameraStream ? (
                      <>
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          autoPlay
                          playsInline
                          muted
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                          <Button
                            size="lg"
                            className="rounded-full px-10"
                            onClick={handleCapturePhoto}
                            disabled={capturedCameraPhotos.length >= 3}
                          >
                            Capturar foto ({capturedCameraPhotos.length}/3)
                          </Button>
                          <p className="text-[11px] text-white/80">
                            {capturedCameraPhotos.length < 3
                              ? `Você ainda pode tirar ${3 - capturedCameraPhotos.length} ${
                                  capturedCameraPhotos.length === 2 ? 'foto' : 'fotos'
                                }`
                              : 'Limite de fotos atingido'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Ative a câmera do dispositivo para continuar.
                      </div>
                    )}
                  </div>
                  {capturedCameraPhotos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {capturedCameraPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-md overflow-hidden border bg-background"
                        >
                          <img
                            src={photo}
                            alt={`Pré-visualização ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      Tire até três fotos antes de enviar.
                    </p>
                  )}
                  <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" onClick={closeCameraCapture}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleConfirmCameraPhotos}
                      disabled={capturedCameraPhotos.length === 0}
                    >
                      Usar fotos ({capturedCameraPhotos.length})
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>

            <Input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={isUploading}
            />

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
                  onClick={openPhotoSelector}
                >
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">Adicionar</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </CardContent>
        <CardFooter>
          <Button
            className="w-full text-lg py-6 font-semibold shadow-lg hover:shadow-xl transition-all"
            disabled={
              !selectedMeal || isUploading || isEvaluating || photos.length === 0
            }
            onClick={handleSubmit}
          >
            {isUploading || isEvaluating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isUploading ? 'Processando fotos...' : 'Interpretando refeição...'}
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
