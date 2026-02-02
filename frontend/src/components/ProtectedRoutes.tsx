import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoutes = () => {
  // Simulação de verificação de autenticação
  // Em produção, você validaria a expiração do token ou consultaria o backend
  const isAuthenticated = !!localStorage.getItem('auth_token')

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoutes