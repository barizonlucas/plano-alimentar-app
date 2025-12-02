import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { Toaster } from './ui/toaster'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-8 animate-fade-in">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}
