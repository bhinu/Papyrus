import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default ProtectedRoute
