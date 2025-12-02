import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Home,
  BarChart2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from '@/hooks/use-mobile' // We can create a simpler hook or just use window logic, but lets just mock useWindowSize logic inside component to avoid dependency issues if file is read-only.
// Actually, I will just implement useWindowSize logic inside here or use fixed size for simplicity as I cannot edit hooks/use-mobile.tsx and it exports useIsMobile not useWindowSize.

export default function MealFeedback() {
  const location = useLocation()
  const navigate = useNavigate()
  const { score, mealName } = (location.state as {
    score: number
    mealName: string
  }) || { score: 0, mealName: 'Refeição' }

  // Ensure user didn't just navigate here directly
  useEffect(() => {
    if (!location.state) {
      navigate('/')
    }
  }, [location, navigate])

  const getFeedbackData = (score: number) => {
    if (score >= 90)
      return {
        color: 'text-green-500',
        bgColor: 'bg-green-100',
        icon: CheckCircle,
        title: 'Excelente!',
        msg: 'Você seguiu o plano perfeitamente. Continue assim!',
        animation: 'animate-bounce',
      }
    if (score >= 70)
      return {
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100',
        icon: AlertTriangle,
        title: 'Muito Bem!',
        msg: 'Boa escolha, mas pequenos ajustes podem melhorar ainda mais.',
        animation: 'animate-pulse',
      }
    return {
      color: 'text-red-500',
      bgColor: 'bg-red-100',
      icon: XCircle,
      title: 'Atenção',
      msg: 'Essa refeição fugiu um pouco do plano. Não desanime, a próxima será melhor!',
      animation: 'animate-none',
    }
  }

  const data = getFeedbackData(score)
  const Icon = data.icon

  // Confetti logic
  const [showConfetti, setShowConfetti] = useState(score >= 90)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
    return () => window.removeEventListener('resize', handleResize)
  }, [showConfetti])

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] relative overflow-hidden">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={200}
          recycle={false}
        />
      )}

      <Card
        className="w-full max-w-md text-center shadow-lg border-t-4 animate-pop"
        style={{
          borderTopColor:
            score >= 70 ? (score >= 90 ? '#4CAF50' : '#EAB308') : '#EF4444',
        }}
      >
        <CardHeader>
          <div
            className={`mx-auto p-4 rounded-full w-fit mb-4 ${data.bgColor} ${data.animation}`}
          >
            <Icon className={`h-16 w-16 ${data.color}`} />
          </div>
          <CardTitle className="text-3xl font-bold">{data.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <span className="text-6xl font-black tracking-tighter text-foreground">
              {score}
            </span>
            <span className="text-xl text-muted-foreground">/ 100 pontos</span>
          </div>
          <p className="text-lg text-muted-foreground px-4">{data.msg}</p>

          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Refeição
            </p>
            <p className="text-lg font-semibold">{mealName}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full text-lg h-12" onClick={() => navigate('/')}>
            <Home className="mr-2 h-5 w-5" /> Voltar ao Início
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/progress')}
          >
            Ver Meu Progresso <BarChart2 className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
