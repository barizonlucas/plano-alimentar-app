import usePlanStore from '@/stores/usePlanStore'
import useProgressStore from '@/stores/useProgressStore'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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

const EXPORT_FILE_NAME = 'diet-ai-backup.json'
const APP_VERSION = 'DietAI v0.0.1'
const JSON_MIME_TYPE = 'data:application/json;charset=utf-8,'

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
    const dataUri = JSON_MIME_TYPE + encodeURIComponent(dataStr)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', EXPORT_FILE_NAME)
    linkElement.click()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your data and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Your Data
          </CardTitle>
          <CardDescription>
            All your data is stored locally on your device.
            We do not have access to your information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
            <div>
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-muted-foreground">
                Download a copy of your plan and history.
              </p>
            </div>
            <Button variant="outline" onClick={exportAllData}>
              <Download className="mr-2 h-4 w-4" /> Download JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div>
              <p className="font-medium text-destructive">Clear Progress</p>
              <p className="text-sm text-destructive/80">
                Clears meal history, points, and achievements. The plan is
                kept.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Clear Progress
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action will delete all your meal history, points,
                    and badges. You will not be able to recover this data.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" onClick={clearProgress}>
                    Yes, delete everything
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground pt-8">
        <p>{APP_VERSION}</p>
      </div>
    </div>
  )
}
