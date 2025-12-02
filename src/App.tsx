import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import MyPlan from './pages/MyPlan'
import LogMeal from './pages/LogMeal'
import MealFeedback from './pages/MealFeedback'
import ProgressPage from './pages/Progress'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { PlanProvider } from './stores/usePlanStore'
import { ProgressProvider } from './stores/useProgressStore'

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <PlanProvider>
        <ProgressProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/plan" element={<MyPlan />} />
              <Route path="/log" element={<LogMeal />} />
              <Route path="/feedback" element={<MealFeedback />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ProgressProvider>
      </PlanProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
