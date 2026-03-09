import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import LandingPage from './pages/Landing'
import { LoginPage, RegisterPage } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import SkillsPage from './pages/Skills'
import Marketplace from './pages/Marketplace'
import Sessions from './pages/Sessions'
import WalletPage from './pages/Wallet'
import AIAssistant from './pages/AIAssistant'
import AdminPanel from './pages/Admin'

function FullScreenLoader({ title = 'Loading workspace...', subtitle = 'Please wait while TalentConnect restores your session.' }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-5 h-10 w-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-gray-400">{subtitle}</p>
      </div>
    </div>
  )
}

function SessionRestoreError() {
  const { retryInit } = useAuthStore()

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="card max-w-lg p-8 text-center">
        <h1 className="text-2xl font-semibold text-white font-display">Reconnecting to TalentConnect</h1>
        <p className="mt-3 text-sm leading-7 text-gray-400">
          Your saved session still exists, but the backend did not respond in time. This usually happens when the hosted server is waking up.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={retryInit} className="btn-primary">
            Retry
          </button>
          <Link to="/" className="btn-secondary">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, restoreError } = useAuthStore()
  if (loading) return <FullScreenLoader />
  if (restoreError) return <SessionRestoreError />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <FullScreenLoader title="Checking your session..." subtitle="Please wait while we check whether you are already signed in." />
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
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected App */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/skills"       element={<SkillsPage />} />
          <Route path="/marketplace"  element={<Marketplace />} />
          <Route path="/sessions"     element={<Sessions />} />
          <Route path="/wallet"       element={<WalletPage />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/admin"        element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
