import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import { LoginPage, RegisterPage } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import SkillsPage from './pages/Skills'
import Marketplace from './pages/Marketplace'
import Sessions from './pages/Sessions'
import WalletPage from './pages/Wallet'
import AIAssistant from './pages/AIAssistant'
import AdminPanel from './pages/Admin'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { init } = useAuthStore()

  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#171b26', color: '#e5e7eb', border: '1px solid #2a2f45' },
          success: { iconTheme: { primary: '#4f52e5', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected App */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<Dashboard />} />
          <Route path="skills"       element={<SkillsPage />} />
          <Route path="marketplace"  element={<Marketplace />} />
          <Route path="sessions"     element={<Sessions />} />
          <Route path="wallet"       element={<WalletPage />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="admin"        element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
