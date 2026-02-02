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
  Home,
  BarChart2,
} from 'lucide-react'
import { useEffect } from 'react'
import { MealAnalysis } from '@/lib/types'

export default function MealFeedback() {
  const location = useLocation()
  const navigate = useNavigate()
  const { score, mealName, analysis } = (location.state as {
    score: number
    mealName: string
    analysis?: MealAnalysis
  }) || { score: 0, mealName: 'Refeição', analysis: undefined }

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] relative overflow-hidden p-4">
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

          {analysis && (
            <div className="bg-muted/20 p-4 rounded-lg space-y-3 text-left">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-muted-foreground">Aderência</span>
                <span className="text-foreground">
                  {analysis.aderencia} ({Math.round(analysis.percentual)}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-muted-foreground">Pontuação Gemini</span>
                <span className="text-foreground">
                  {analysis.pontuacao}/10
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.descricao}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  {
                    label: 'Calorias',
                    value: `${analysis.nutrientes_estimados.calorias} kcal`,
                  },
                  {
                    label: 'Proteínas',
                    value: `${analysis.nutrientes_estimados.proteinas} g`,
                  },
                  {
                    label: 'Carboidratos',
                    value: `${analysis.nutrientes_estimados.carboidratos} g`,
                  },
                  {
                    label: 'Gorduras',
                    value: `${analysis.nutrientes_estimados.gorduras} g`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-md border bg-background/60 p-2 flex flex-col"
                  >
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="font-semibold text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
