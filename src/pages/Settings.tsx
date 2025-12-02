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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2, Download, Shield } from 'lucide-react'

export default function Settings() {
  const { plan } = usePlanStore()
  const { logs, stats, clearData: clearProgress } = useProgressStore()

  const exportAllData = () => {
    const data = {
      userPlan: plan,
      userLogs: logs,
      userStats: stats,
      exportDate: new Date().toISOString(),
    }

    const dataStr = JSON.stringify(data, null, 2)
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', 'nutriplan-backup-completo.json')
    linkElement.click()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie seus dados e preferências.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Seus Dados
          </CardTitle>
          <CardDescription>
            Todos os seus dados são armazenados localmente no seu dispositivo.
            Nós não temos acesso às suas informações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
            <div>
              <p className="font-medium">Exportar Dados</p>
              <p className="text-sm text-muted-foreground">
                Baixe uma cópia do seu plano e histórico.
              </p>
            </div>
            <Button variant="outline" onClick={exportAllData}>
              <Download className="mr-2 h-4 w-4" /> Baixar JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div>
              <p className="font-medium text-destructive">Apagar Progresso</p>
              <p className="text-sm text-destructive/80">
                Limpa histórico de refeições, pontos e conquistas. O plano é
                mantido.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Limpar Progresso
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tem certeza absoluta?</DialogTitle>
                  <DialogDescription>
                    Esta ação apagará todo o seu histórico de refeições, pontos
                    e emblemas. Você não poderá recuperar esses dados.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button variant="destructive" onClick={clearProgress}>
                    Sim, apagar tudo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground pt-8">
        <p>NutriPlan v0.0.1</p>
      </div>
    </div>
  )
}
