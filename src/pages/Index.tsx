import usePlanStore from '@/stores/usePlanStore'
import useProgressStore from '@/stores/useProgressStore'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Flame,
  Plus,
  Utensils,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const HeroSection = () => (
  <div className="flex flex-col items-center justify-center text-center py-12 md:py-20 space-y-8 max-w-3xl mx-auto">
    <div className="bg-green-100 p-4 rounded-full">
      <Utensils className="h-12 w-12 text-primary" />
    </div>
    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
      Coma Bem, <span className="text-primary">Viva Melhor</span>.
    </h1>
    <p className="text-lg md:text-xl text-muted-foreground">
      Monitore sua dieta, receba feedback instantâneo e alcance seus objetivos
      de saúde com privacidade total.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
      <Button asChild size="lg" className="text-lg px-8">
        <Link to="/plan">
          Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8">
      <Card className="bg-secondary/20 border-none shadow-sm">
        <CardContent className="pt-6 flex flex-col items-center gap-2">
          <CheckCircle className="h-8 w-8 text-primary" />
          <p className="font-semibold">Feedback Real</p>
        </CardContent>
      </Card>
      <Card className="bg-secondary/20 border-none shadow-sm">
        <CardContent className="pt-6 flex flex-col items-center gap-2">
          <Calendar className="h-8 w-8 text-primary" />
          <p className="font-semibold">Planejamento Semanal</p>
        </CardContent>
      </Card>
      <Card className="bg-secondary/20 border-none shadow-sm">
        <CardContent className="pt-6 flex flex-col items-center gap-2">
          <Flame className="h-8 w-8 text-primary" />
          <p className="font-semibold">Mantenha o Foco</p>
        </CardContent>
      </Card>
    </div>
  </div>
)

const DashboardSection = () => {
  const { getTodayPlan } = usePlanStore()
  const { stats, logs } = useProgressStore()
  const todayPlan = getTodayPlan()
  const navigate = useNavigate()

  // Calculate Today's Progress
  const today = new Date().toISOString().split('T')[0]
  const todaysLogs = logs.filter((log) => log.date.startsWith(today))
  const totalMeals = todayPlan.meals.length
  const mealsLogged = todaysLogs.length
  const dailyProgress = totalMeals > 0 ? (mealsLogged / totalMeals) * 100 : 0

  // Find next meal
  const currentHour = new Date().getHours()
  const nextMeal =
    todayPlan.meals.find((m) => {
      const mealHour = parseInt(m.time.split(':')[0])
      return (
        mealHour >= currentHour && !todaysLogs.some((l) => l.mealId === m.id)
      )
    }) ||
    todayPlan.meals.find((m) => !todaysLogs.some((l) => l.mealId === m.id)) // or first unlogged

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Olá, Bem-vindo de volta!</h1>
          <p className="text-muted-foreground">
            Aqui está o resumo do seu dia.
          </p>
        </div>
        <Button
          onClick={() =>
            navigate(nextMeal ? `/log?mealId=${nextMeal.id}` : '/log')
          }
        >
          <Plus className="mr-2 h-4 w-4" /> Registrar Refeição
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aderência Diária
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(dailyProgress)}%
            </div>
            <Progress value={dailyProgress} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {mealsLogged} de {totalMeals} refeições registradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sequência Atual
            </CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak} Dias</div>
            <p className="text-xs text-muted-foreground">Continue firme!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              Acumulados até agora
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/90">
              Próxima Refeição
            </CardTitle>
            <Utensils className="h-4 w-4 text-primary-foreground/90" />
          </CardHeader>
          <CardContent>
            {nextMeal ? (
              <>
                <div className="text-xl font-bold">{nextMeal.name}</div>
                <div className="text-sm opacity-90">{nextMeal.time}</div>
              </>
            ) : (
              <div className="text-lg font-medium">
                Tudo pronto por hoje! 🎉
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Refeições de Hoje
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {todayPlan.meals.length > 0 ? (
            todayPlan.meals.map((meal) => {
              const isLogged = todaysLogs.some((l) => l.mealId === meal.id)
              return (
                <Card
                  key={meal.id}
                  className={cn(
                    'transition-all hover:shadow-md',
                    isLogged ? 'border-green-200 bg-green-50/50' : '',
                  )}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{meal.name}</CardTitle>
                        <CardDescription>{meal.time}</CardDescription>
                      </div>
                      {isLogged && (
                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                          Feito
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {meal.items.map((item, idx) => (
                        <li key={idx}>{item.name}</li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {!isLogged && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/log?mealId=${meal.id}`)}
                      >
                        Registrar
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })
          ) : (
            <div className="col-span-2 text-center py-8 text-muted-foreground border-dashed border rounded-lg">
              Nenhuma refeição planejada para hoje.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Index = () => {
  const { hasPlan } = usePlanStore()
  return hasPlan ? <DashboardSection /> : <HeroSection />
}

export default Index
