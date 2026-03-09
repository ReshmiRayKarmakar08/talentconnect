import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, ShoppingBag, Calendar, Wallet,
  TrendingUp, Star, Clock, CheckCircle2, ArrowRight, Sparkles
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { sessionsAPI, tasksAPI, paymentsAPI, skillsAPI } from '../utils/api'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, color, to }) {
  const card = (
    <div className={`card p-5 flex items-center gap-4 hover:border-${color}-500/40 transition-all duration-200 group`}>
      <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center shrink-0`}>
        <Icon size={22} className={`text-${color}-400`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-display">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to} className="block">{card}</Link> : card
}

function SessionRow({ session }) {
  const statusColors = {
    pending: 'badge-yellow', confirmed: 'badge-blue',
    completed: 'badge-green', cancelled: 'badge-red',
  }
  return (
    <div className="flex items-center justify-between py-3 border-b border-surface-border last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-200">{session.skill?.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          with {session.mentor?.full_name} · {new Date(session.scheduled_at).toLocaleDateString()}
        </p>
      </div>
      <span className={`badge ${statusColors[session.status] || 'badge-gray'}`}>
        {session.status}
      </span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [tasks, setTasks] = useState([])
  const [wallet, setWallet] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      sessionsAPI.my().catch(() => ({ data: [] })),
      tasksAPI.my().catch(() => ({ data: [] })),
      paymentsAPI.wallet().catch(() => ({ data: null })),
      skillsAPI.recommendations().catch(() => ({ data: [] })),
    ]).then(([s, t, w, r]) => {
      setSessions(s.data?.slice(0, 4) || [])
      setTasks(t.data?.slice(0, 4) || [])
      setWallet(w.data)
      setRecommendations(r.data?.slice(0, 3) || [])
      setLoading(false)
    })
  }, [])

  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const activeTasks = tasks.filter(t => ['open', 'assigned', 'submitted'].includes(t.status)).length

  return (
    <div className="p-8 animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gray-500 text-sm mb-1">Welcome back 👋</p>
        <h1 className="page-header">{user?.full_name}</h1>
        <p className="text-gray-400 mt-1 text-sm">@{user?.username} · {user?.college || 'Student'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Calendar}    label="My Sessions"    value={sessions.length}  color="brand" to="/sessions" />
        <StatCard icon={ShoppingBag} label="Active Tasks"   value={activeTasks}      color="green" to="/marketplace" />
        <StatCard icon={CheckCircle2} label="Completed"     value={completedSessions} color="purple" />
        <StatCard icon={Wallet}      label="Wallet Balance" value={`₹${wallet?.balance?.toFixed(0) || '0'}`} color="yellow" to="/wallet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Sessions</h2>
            <Link to="/sessions" className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1 transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No sessions yet</p>
              <Link to="/sessions?discover=1" className="btn-primary inline-flex mt-3 text-sm">
                Find a mentor
              </Link>
            </div>
          ) : (
            sessions.map(s => <SessionRow key={s.id} session={s} />)
          )}
        </div>

        {/* AI Recommendations */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-brand-400" />
            <h2 className="section-title">Recommended Skills</h2>
          </div>
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles size={28} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Add skills to get recommendations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <Link
                  key={i}
                  to="/skills"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-hover
                             hover:border-brand-500/30 border border-transparent transition-all group"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-200">{rec.skill?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{rec.skill?.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-400 font-medium">
                      {Math.round((rec.confidence || 0.5) * 100)}% match
                    </p>
                    <ArrowRight size={12} className="text-gray-600 group-hover:text-brand-400 ml-auto mt-0.5 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-surface-border">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-yellow-400" />
              <span className="text-sm font-medium text-gray-300">Your Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-surface-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all"
                  style={{ width: `${Math.min((user?.reputation_score / 5) * 100, 100)}%` }}
                />
              </div>
              <span className="text-sm font-bold text-white">{user?.reputation_score?.toFixed(1) || '0.0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Tasks</h2>
          <Link to="/marketplace" className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1 transition-colors">
            Marketplace <ArrowRight size={14} />
          </Link>
        </div>
        {tasks.length === 0 ? (
          <div className="text-center py-6">
            <ShoppingBag size={28} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No tasks yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map(task => (
              <Link
                key={task.id}
                to={`/marketplace/${task.id}`}
                className="p-4 rounded-xl bg-surface-hover border border-surface-border
                           hover:border-brand-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-200 line-clamp-1">{task.title}</p>
                  <span className="badge badge-green shrink-0">₹{task.budget}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{task.subject} · Due {new Date(task.deadline).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
