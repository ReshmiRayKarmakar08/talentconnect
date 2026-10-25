import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import BrandMark from '../branding/BrandMark'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    let cancelled = false
    const ping = () => {
      if (cancelled) return
      api.get('/health').catch(() => {})
    }
    ping()
    const interval = setInterval(ping, 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-card border-b border-surface-border sticky top-0 z-30 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          <Link to="/" className="flex items-center">
            <BrandMark textClassName="text-base" />
          </Link>
          <Link
            to="/profile"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xs font-bold text-white shadow-sm"
          >
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </Link>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
