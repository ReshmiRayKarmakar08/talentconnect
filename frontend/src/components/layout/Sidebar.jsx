import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, ShoppingBag, Calendar,
  Wallet, Bot, Shield, Bell, LogOut, User, ChevronRight, X
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import clsx from 'clsx'
import BrandMark from '../branding/BrandMark'

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/skills',        icon: BookOpen,         label: 'Skills' },
  { to: '/marketplace',   icon: ShoppingBag,      label: 'Marketplace' },
  { to: '/sessions',      icon: Calendar,         label: 'Sessions' },
  { to: '/wallet',        icon: Wallet,           label: 'Wallet' },
  { to: '/ai-assistant',  icon: Bot,              label: 'AI Assistant' },
]

const adminItems = [
  { to: '/admin',         icon: Shield,           label: 'Admin Panel' },
]

export function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    onClose()
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen w-64 bg-surface-card border-r border-surface-border flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Logo & Mobile Close */}
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <Link to="/" onClick={onClose} className="transition-opacity hover:opacity-90">
            <BrandMark textClassName="text-lg" />
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 md:hidden transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors duration-200 group outline-none',
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border-brand-500/40 shadow-sm'
                    : 'border-transparent text-gray-400 hover:text-gray-100 hover:bg-white/[0.06] hover:border-white/5'
                )
              }
            >
              <Icon size={17} className="shrink-0 transition-colors" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {user?.role === 'admin' && (
          <>
            <div className="mt-5 mb-2 px-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Admin</span>
            </div>
            <div className="space-y-1">
              {adminItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors duration-200 group outline-none',
                      isActive
                        ? 'bg-red-500/15 text-red-400 border-red-500/30 shadow-sm'
                        : 'border-transparent text-gray-400 hover:text-gray-100 hover:bg-white/[0.06] hover:border-white/5'
                    )
                  }
                >
                  <Icon size={17} className="shrink-0 transition-colors" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-surface-border">
        <NavLink
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
          </div>
          <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500
                     hover:text-red-400 hover:bg-red-500/10 transition-all mt-0.5"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  </>
  )
}

export function TopBar({ title }) {
  const { user } = useAuthStore()
  return (
    <header className="h-14 bg-surface-card border-b border-surface-border flex items-center
                       justify-between px-6 sticky top-0 z-30">
      <h1 className="font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-2">
        <NavLink to="/notifications" className="btn-ghost relative">
          <Bell size={18} />
        </NavLink>
        <NavLink to="/profile" className="btn-ghost">
          <User size={18} />
        </NavLink>
      </div>
    </header>
  )
}
