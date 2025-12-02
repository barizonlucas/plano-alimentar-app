import useProgressStore from '@/stores/useProgressStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trophy, Star, Zap, Calendar } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart' // Reusing shadcn chart wrapper if available, or just raw recharts if wrapper is complex to mock without file. Context says src/components/ui/chart.tsx exists.
import { format, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ProgressPage() {
  const { stats, badges, logs } = useProgressStore()

  // Prepare Chart Data (Last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayLogs = logs.filter((l) => l.date.startsWith(dateStr))
    const avgScore =
      dayLogs.length > 0
        ? Math.round(
            dayLogs.reduce((acc, curr) => acc + curr.score, 0) / dayLogs.length,
          )
        : 0

    return {
      day: format(date, 'EEE', { locale: ptBR }),
      score: avgScore,
      fullDate: dateStr,
    }
  })

  const chartConfig = {
    score: {
      label: 'Pontuação',
      color: 'hsl(var(--chart-1))',
    },
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Meu Progresso</h1>
        <p className="text-muted-foreground">
          Acompanhe sua evolução e conquistas.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pontuação Total
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Refeições Registradas
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Sequência Atual
            </CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak} Dias</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Melhor Sequência
            </CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bestStreak} Dias</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Aderência Semanal</CardTitle>
          <CardDescription>
            Média de pontuação nos últimos 7 dias
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={chartData}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                className="stroke-muted"
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: 'transparent' }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.score >= 70
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--destructive))'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Badges */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Conquistas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <Card
              key={badge.id}
              className={`text-center transition-all ${badge.unlocked ? 'border-primary/50 bg-primary/5' : 'opacity-60 grayscale'}`}
            >
              <CardContent className="pt-6 flex flex-col items-center gap-3">
                <div className="text-4xl">{badge.icon}</div>
                <div>
                  <h3 className="font-bold">{badge.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {badge.description}
                  </p>
                </div>
                {badge.unlocked && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/20 text-primary hover:bg-primary/30"
                  >
                    Desbloqueado
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Histórico Recente</h2>
        <Card>
          <ScrollArea className="h-[300px]">
            <CardContent className="p-0">
              {logs.length > 0 ? (
                <div className="divide-y">
                  {logs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <p className="font-medium">{log.mealName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            parseISO(log.date),
                            "dd 'de' MMM 'às' HH:mm",
                            { locale: ptBR },
                          )}
                        </p>
                      </div>
                      <div
                        className={`text-lg font-bold ${log.score >= 70 ? 'text-green-600' : 'text-red-500'}`}
                      >
                        {log.score} pts
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum registro ainda.
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}
