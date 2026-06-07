import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/store/authStore'
import { ReceiptProvider } from '@/context/ReceiptContext'

import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import DashboardPage from '@/pages/DashboardPage'
import GroupDetailPage from '@/pages/GroupDetailPage'
import FriendsPage from '@/pages/FriendsPage'
import UploadPage from '@/pages/UploadPage'
import SplitPage from '@/pages/SplitPage'

function App() {
  const { init } = useAuthStore()
  useEffect(() => init(), [])

  return (
    <ReceiptProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailPage /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />

          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/split" element={<ProtectedRoute><SplitPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ReceiptProvider>
  )
}

export default App
