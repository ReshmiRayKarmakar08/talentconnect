import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import api from '../../utils/api'

export default function AppLayout() {
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
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
