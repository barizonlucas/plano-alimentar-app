import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const LandingPage = () => {
  const navigate = useNavigate()

  const handleLogin = () => {
    // Mock de autenticação: define um token fictício e redireciona
    localStorage.setItem('auth_token', 'demo-token-jwt-mock')
    navigate('/app')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-2xl text-primary">PlanoAI</div>
          <nav className="flex gap-4">
            <Button variant="ghost" onClick={handleLogin}>
              Entrar
            </Button>
            <Button onClick={handleLogin}>Começar Agora</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 flex flex-col items-center text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl">
            Sua dieta planejada por <span className="text-primary">Inteligência Artificial</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Receba planos alimentares personalizados, analise suas refeições com fotos e acompanhe seu progresso de forma simples e inteligente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 min-w-[200px]">
            <Button size="lg" className="text-lg px-8" onClick={handleLogin}>
              Gerar meu Plano Grátis
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Saiba mais
            </Button>
          </div>
        </section>

        {/* Features Placeholder */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-12">Como funciona</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-background rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">1</div>
                <h3 className="text-xl font-semibold mb-2">Envie seus dados</h3>
                <p className="text-muted-foreground">Conte-nos sobre seus objetivos e preferências alimentares.</p>
              </div>
              <div className="p-6 bg-background rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">2</div>
                <h3 className="text-xl font-semibold mb-2">Receba o Plano</h3>
                <p className="text-muted-foreground">Nossa IA cria um cardápio semanal completo para você.</p>
              </div>
              <div className="p-6 bg-background rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">3</div>
                <h3 className="text-xl font-semibold mb-2">Registre Refeições</h3>
                <p className="text-muted-foreground">Tire fotos do que comeu e receba feedback instantâneo.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} Plano Alimentar AI. Todos os direitos reservados.
      </footer>
    </div>
  )
}

export default LandingPage