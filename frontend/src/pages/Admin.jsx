import { useEffect, useState } from 'react'
import { Users, ShoppingBag, Calendar, DollarSign, AlertTriangle, Ban, CheckCircle, Flag, Eye, Loader2 } from 'lucide-react'
import { adminAPI } from '../utils/api'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center`}>
        <Icon size={20} className={`text-${color}-400`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-display">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [tasksDetailed, setTasksDetailed] = useState([])
  const [sessions, setSessions] = useState([])
  const [sessionFeedback, setSessionFeedback] = useState([])
  const [taskFeedback, setTaskFeedback] = useState([])
  const [skillVerifications, setSkillVerifications] = useState([])
  const [riskUsers, setRiskUsers] = useState([])
  const [fraudLogs, setFraudLogs] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [userDetail, setUserDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const loadCore = async () => {
      setLoading(true)
      setLoadError(false)
      try {
        const [statsRes, usersRes] = await Promise.all([
          adminAPI.stats(),
          adminAPI.users(),
        ])
        setStats(statsRes.data)
        setUsers(usersRes.data)
      } catch {
        setLoadError(true)
        toast.error('Failed to load admin data')
      } finally {
        setLoading(false)
      }
    }

    loadCore()
  }, [])

  useEffect(() => {
    const loadTabData = async () => {
      if (loading) return
      setTabLoading(true)
      try {
        if (tab === 'tasks-monitoring' && tasksDetailed.length === 0) {
          const { data } = await adminAPI.tasksDetailed()
          setTasksDetailed(data)
        }
        if (tab === 'sessions-monitoring' && sessions.length === 0) {
          const [sess, sv] = await Promise.all([
            adminAPI.sessions(),
            adminAPI.skillVerifications(),
          ])
          setSessions(sess.data)
          setSkillVerifications(sv.data)
        }
        if (tab === 'fraud-alerts' && (riskUsers.length === 0 && fraudLogs.length === 0)) {
          const [risk, fraud] = await Promise.all([
            adminAPI.riskUsers(),
            adminAPI.fraudLogs(),
          ])
          setRiskUsers(risk.data)
          setFraudLogs(fraud.data)
        }
        if (tab === 'feedback-review' && (sessionFeedback.length === 0 && taskFeedback.length === 0)) {
          const [sfb, tfb] = await Promise.all([
            adminAPI.sessionFeedback(),
            adminAPI.taskFeedback(),
          ])
          setSessionFeedback(sfb.data)
          setTaskFeedback(tfb.data)
        }
      } catch {
        toast.error('Failed to load admin data')
      } finally {
        setTabLoading(false)
      }
    }

    loadTabData()
  }, [tab, loading])

  const handleBan = async (userId, isBanned) => {
    try {
      if (isBanned) { await adminAPI.unbanUser(userId); toast.success('User unbanned') }
      else { await adminAPI.banUser(userId); toast.success('User banned') }
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: isBanned } : u))
    } catch { toast.error('Action failed') }
  }

  const handleFlagTask = async (taskId) => {
    try {
      await adminAPI.flagTask(taskId, 'Flagged by admin for review')
      setTasksDetailed(tasksDetailed.map(t => t.id === taskId ? { ...t, is_flagged: true, status: 'flagged' } : t))
      toast.success('Task flagged')
    } catch { toast.error('Failed') }
  }

  const handleRemoveTask = async (taskId) => {
    try {
      await adminAPI.removeTask(taskId)
      setTasksDetailed(tasksDetailed.filter(t => t.id !== taskId))
      toast.success('Task removed')
    } catch { toast.error('Failed to remove task') }
  }

  const handleUserDetail = async (userId) => {
    setDetailLoading(true)
    try {
      const { data } = await adminAPI.userDetail(userId)
      setUserDetail(data)
    } catch {
      toast.error('Failed to load user details')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleReviewLog = async (logId) => {
    try {
      await adminAPI.reviewFraudLog(logId)
      setFraudLogs(fraudLogs.map(l => l.id === logId ? { ...l, is_reviewed: true } : l))
      toast.success('Marked as reviewed')
    } catch { toast.error('Failed') }
  }

  const tabs = [
    { key: 'overview', label: 'Admin Overview' },
    { key: 'user-management', label: 'User Management' },
    { key: 'tasks-monitoring', label: 'Tasks Monitoring' },
    { key: 'sessions-monitoring', label: 'Sessions Monitoring' },
    { key: 'fraud-alerts', label: 'Fraud Alerts' },
    { key: 'feedback-review', label: 'Feedback Review' },
  ]

  return (
    <div className="p-8 animate-slide-up">
      <div className="mb-8">
        <h1 className="page-header">System Controller</h1>
        <p className="text-gray-500 text-sm mt-1">Platform administration & oversight</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-card border border-surface-border rounded-xl p-1 w-fit mb-6">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
              ${tab === key ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            {label}
            {key === 'fraud-alerts' && stats?.fraud_alerts > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {stats.fraud_alerts}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-400" size={28} /></div>
      ) : loadError ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">Failed to load admin data.</p>
          <button onClick={() => window.location.reload()} className="btn-secondary mt-4">Retry</button>
        </div>
      ) : (
        <>
          {tabLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-brand-400" size={22} />
            </div>
          )}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={Users}       label="Total Users"    value={stats.total_users}   color="brand" />
                <StatCard icon={CheckCircle} label="Active Users"   value={stats.active_users}  color="green" />
                <StatCard icon={Calendar}    label="Total Sessions" value={stats.total_sessions} color="purple" />
                <StatCard icon={ShoppingBag} label="Total Tasks"    value={stats.total_tasks}    color="yellow" />
                <StatCard icon={Users}       label="Total Skills"   value={stats.total_skills}  color="brand" />
                <StatCard icon={CheckCircle} label="Sessions Completed" value={stats.completed_sessions} color="green" />
                <StatCard icon={DollarSign}  label="Revenue (₹)"    value={`₹${stats.total_revenue?.toFixed(0)}`} color="green" />
                <StatCard icon={AlertTriangle} label="Fraud Alerts" value={stats.fraud_alerts}  color="red" />
              </div>
            </div>
          )}

          {tab === 'user-management' && (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-hover">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">User</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Reputation</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xs font-bold text-white">
                            {u.full_name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-200">{u.full_name}</p>
                            <p className="text-xs text-gray-500">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                          {u.is_active ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{u.reputation_score?.toFixed(1)}</td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleBan(u.id, !u.is_active)}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1
                                ${u.is_active
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                                }`}
                            >
                              {u.is_active ? <><Ban size={11} /> Ban</> : <><CheckCircle size={11} /> Unban</>}
                            </button>
                            <button
                              onClick={() => handleUserDetail(u.id)}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 border border-white/10 text-gray-300 hover:text-white"
                            >
                              <Eye size={11} /> View
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'tasks-monitoring' && (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-hover">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Task</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Posted by</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Budget</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Payment</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasksDetailed.map(t => (
                    <tr key={t.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-200 line-clamp-1 max-w-xs">{t.title}</p>
                        <p className="text-xs text-gray-500">{t.subject}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{t.poster?.full_name}</td>
                      <td className="px-4 py-3 text-green-400 font-medium">₹{t.budget}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${t.is_flagged ? 'badge-red' : t.status === 'completed' ? 'badge-green' : 'badge-blue'}`}>
                          {t.is_flagged ? 'flagged' : t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {t.payment_status ? (
                          <span className={`badge ${t.payment_status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>
                            {t.payment_status}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {!t.is_flagged && (
                            <button onClick={() => handleFlagTask(t.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1">
                              <Flag size={11} /> Flag
                            </button>
                          )}
                          <button onClick={() => handleRemoveTask(t.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-surface-hover text-gray-300 border border-white/10 hover:text-white transition-all flex items-center gap-1">
                            <Trash2 size={11} /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'sessions-monitoring' && (
            <div className="space-y-6">
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-hover">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Session</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Mentor</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Learner</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Scheduled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-200">Session #{s.id}</p>
                          <p className="text-xs text-gray-500">{s.skill?.name}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{s.mentor?.full_name}</td>
                        <td className="px-4 py-3 text-gray-400">{s.learner?.full_name}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${s.status === 'completed' ? 'badge-green' : s.status === 'cancelled' ? 'badge-red' : 'badge-blue'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{new Date(s.scheduled_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-border bg-surface-hover text-sm font-medium text-gray-300">
                  Skill Verification Results
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-hover">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">User</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Skill</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Score</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Attempted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillVerifications.map(v => (
                      <tr key={v.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3 text-gray-300">{v.user?.full_name}</td>
                        <td className="px-4 py-3 text-gray-300">{v.skill?.name}</td>
                        <td className="px-4 py-3 text-gray-300">{v.score?.toFixed(0) || '0'}%</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${v.passed ? 'badge-green' : 'badge-red'}`}>
                            {v.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {v.attempted_at ? new Date(v.attempted_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'fraud-alerts' && (
            <div className="space-y-6">
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-border bg-surface-hover text-sm font-medium text-gray-300">
                  High Risk Users
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-hover">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">User</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Cancellations</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Fraud Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskUsers.map((item) => (
                      <tr key={item.user.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3 text-gray-300">{item.user.full_name}</td>
                        <td className="px-4 py-3 text-gray-300">{item.cancellation_count}</td>
                        <td className="px-4 py-3 text-gray-300">{item.fraud_score?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                {fraudLogs.length === 0 ? (
                  <div className="card p-8 text-center">
                    <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
                    <p className="text-gray-500">No fraud alerts</p>
                  </div>
                ) : fraudLogs.map(log => (
                  <div key={log.id} className={`card p-4 flex items-center justify-between
                    ${log.severity === 'high' ? 'border-red-500/30' : log.severity === 'medium' ? 'border-yellow-500/30' : ''}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} className={
                          log.severity === 'high' ? 'text-red-400' : log.severity === 'medium' ? 'text-yellow-400' : 'text-gray-400'
                        } />
                        <p className="font-medium text-gray-200 text-sm">{log.event_type.replace(/_/g, ' ')}</p>
                        <span className={`badge text-xs
                          ${log.severity === 'high' ? 'badge-red' : log.severity === 'medium' ? 'badge-yellow' : 'badge-gray'}`}>
                          {log.severity}
                        </span>
                        {log.is_reviewed && <span className="badge badge-green">reviewed</span>}
                      </div>
                      <p className="text-xs text-gray-500">User ID: {log.user_id} · {log.details}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                    {!log.is_reviewed && (
                      <button onClick={() => handleReviewLog(log.id)}
                        className="btn-secondary text-xs px-3 py-1.5 shrink-0 ml-4">
                        Mark Reviewed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'feedback-review' && (
            <div className="space-y-6">
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-border bg-surface-hover text-sm font-medium text-gray-300">
                  Session Feedback
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-hover">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Session</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Rating</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Review</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionFeedback.map(fb => (
                      <tr key={fb.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3 text-gray-300">#{fb.session_id}</td>
                        <td className="px-4 py-3 text-gray-300">{fb.rating}</td>
                        <td className="px-4 py-3 text-gray-400">{fb.review || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(fb.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-border bg-surface-hover text-sm font-medium text-gray-300">
                  Task Feedback
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-hover">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Task</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Rating</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Review</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskFeedback.map(fb => (
                      <tr key={fb.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3 text-gray-300">#{fb.task_id}</td>
                        <td className="px-4 py-3 text-gray-300">{fb.rating}</td>
                        <td className="px-4 py-3 text-gray-400">{fb.review || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(fb.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {userDetail && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="card w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{userDetail.user.full_name}</h2>
                    <p className="text-sm text-gray-400">@{userDetail.user.username} · {userDetail.user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{userDetail.user.college || 'College not set'}</p>
                  </div>
                  <button onClick={() => setUserDetail(null)} className="btn-secondary text-xs px-3 py-1.5">Close</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                  <div className="rounded-xl border border-surface-border bg-surface-hover p-3 text-sm text-gray-300">
                    <p className="text-xs text-gray-500">Tasks Posted</p>
                    <p className="text-lg font-semibold text-white">{userDetail.tasks_posted}</p>
                  </div>
                  <div className="rounded-xl border border-surface-border bg-surface-hover p-3 text-sm text-gray-300">
                    <p className="text-xs text-gray-500">Tasks Accepted</p>
                    <p className="text-lg font-semibold text-white">{userDetail.tasks_accepted}</p>
                  </div>
                  <div className="rounded-xl border border-surface-border bg-surface-hover p-3 text-sm text-gray-300">
                    <p className="text-xs text-gray-500">Sessions (Mentor)</p>
                    <p className="text-lg font-semibold text-white">{userDetail.sessions_as_mentor}</p>
                  </div>
                  <div className="rounded-xl border border-surface-border bg-surface-hover p-3 text-sm text-gray-300">
                    <p className="text-xs text-gray-500">Sessions (Learner)</p>
                    <p className="text-lg font-semibold text-white">{userDetail.sessions_as_learner}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div className="rounded-xl border border-surface-border bg-surface-hover p-4">
                    <p className="text-sm font-semibold text-white mb-3">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {userDetail.skills.length === 0 ? (
                        <span className="text-xs text-gray-500">No skills listed</span>
                      ) : userDetail.skills.map((s) => (
                        <span key={s.id} className="badge badge-blue">
                          {s.skill?.name} · {s.level}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-surface-border bg-surface-hover p-4">
                    <p className="text-sm font-semibold text-white mb-3">Ratings</p>
                    <p className="text-xs text-gray-400">Avg Session Rating: {userDetail.avg_session_rating?.toFixed(1) || '—'}</p>
                    <p className="text-xs text-gray-400 mt-1">Avg Task Rating: {userDetail.avg_task_rating?.toFixed(1) || '—'}</p>
                    <p className="text-xs text-gray-500 mt-3">Cancellations: {userDetail.user.cancellation_count}</p>
                    <p className="text-xs text-gray-500">Fraud Score: {userDetail.user.fraud_score?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div className="rounded-xl border border-surface-border bg-surface-hover p-4">
                    <p className="text-sm font-semibold text-white mb-3">Recent Sessions</p>
                    <div className="space-y-2 text-xs text-gray-400">
                      {userDetail.recent_sessions.length === 0 ? 'No sessions yet' : userDetail.recent_sessions.map(s => (
                        <div key={s.id} className="flex items-center justify-between">
                          <span>#{s.id} · {s.skill?.name}</span>
                          <span className="text-gray-500">{s.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-surface-border bg-surface-hover p-4">
                    <p className="text-sm font-semibold text-white mb-3">Recent Tasks</p>
                    <div className="space-y-2 text-xs text-gray-400">
                      {userDetail.recent_tasks.length === 0 ? 'No tasks yet' : userDetail.recent_tasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between">
                          <span>#{t.id} · {t.title}</span>
                          <span className="text-gray-500">{t.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
