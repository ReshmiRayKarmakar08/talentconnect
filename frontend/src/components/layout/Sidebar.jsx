import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, ShoppingBag, Calendar,
  Wallet, Bot, Shield, Bell, LogOut, User, ChevronRight
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

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-card border-r border-surface-border
                      flex flex-col z-40 animate-fade-in">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-surface-border">
        <Link to="/" className="transition-opacity hover:opacity-90">
          <BrandMark textClassName="text-lg" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-surface-hover'
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </div>

        {user?.role === 'admin' && (
          <>
            <div className="mt-4 mb-2 px-3.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">Admin</span>
            </div>
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-surface-hover'
                  )
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-surface-border">
        <NavLink
          to="/profile"
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
