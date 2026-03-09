import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
