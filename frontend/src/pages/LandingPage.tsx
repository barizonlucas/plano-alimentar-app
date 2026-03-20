import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const LandingPage = () => {
  const navigate = useNavigate()

  const AUTH_TOKEN_KEY = 'auth_token'
  const MOCK_TOKEN_VALUE = 'demo-jwt-token-mock'

  const handleLogin = () => {
    // Authentication mock: sets a dummy token and redirects. Replace with actual OAuth/JWT later.
    localStorage.setItem(AUTH_TOKEN_KEY, MOCK_TOKEN_VALUE)
    navigate('/app')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-2xl text-primary">DietAI</div>
          <nav className="flex gap-4">
            <Button variant="ghost" onClick={handleLogin}>
              Sign In
            </Button>
            <Button onClick={handleLogin}>Get Started</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 flex flex-col items-center text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl">
            Your diet planned by <span className="text-primary">Artificial Intelligence</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Get personalized diet plans, analyze your meals with photos, and track your progress simply and intelligently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 min-w-[200px]">
            <Button size="lg" className="text-lg px-8" onClick={handleLogin}>
              Generate my Free Plan
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </section>

        {/* Features Placeholder */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-12">How it works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-background rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">1</div>
                <h3 className="text-xl font-semibold mb-2">Submit your data</h3>
                <p className="text-muted-foreground">Tell us about your goals and dietary preferences.</p>
              </div>
              <div className="p-6 bg-background rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">2</div>
                <h3 className="text-xl font-semibold mb-2">Receive your Plan</h3>
                <p className="text-muted-foreground">Our AI creates a complete weekly menu for you.</p>
              </div>
              <div className="p-6 bg-background rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">3</div>
                <h3 className="text-xl font-semibold mb-2">Log your Meals</h3>
                <p className="text-muted-foreground">Take photos of what you ate and get instant feedback.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} Diet Plan AI. All rights reserved.
      </footer>
    </div>
  )
}

export default LandingPage