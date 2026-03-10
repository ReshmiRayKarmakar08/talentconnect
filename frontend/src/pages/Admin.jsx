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
  const [tasks, setTasks] = useState([])
  const [sessions, setSessions] = useState([])
  const [sessionFeedback, setSessionFeedback] = useState([])
  const [taskFeedback, setTaskFeedback] = useState([])
  const [skillVerifications, setSkillVerifications] = useState([])
  const [fraudLogs, setFraudLogs] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminAPI.stats(),
      adminAPI.users(),
      adminAPI.tasks(),
      adminAPI.sessions(),
      adminAPI.sessionFeedback(),
      adminAPI.taskFeedback(),
      adminAPI.skillVerifications(),
      adminAPI.fraudLogs(),
    ]).then(([s, u, t, sess, sfb, tfb, sv, f]) => {
      setStats(s.data)
      setUsers(u.data)
      setTasks(t.data)
      setSessions(sess.data)
      setSessionFeedback(sfb.data)
      setTaskFeedback(tfb.data)
      setSkillVerifications(sv.data)
      setFraudLogs(f.data)
    }).catch(() => toast.error('Failed to load admin data'))
    .finally(() => setLoading(false))
  }, [])

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
      setTasks(tasks.map(t => t.id === taskId ? { ...t, is_flagged: true, status: 'flagged' } : t))
      toast.success('Task flagged')
    } catch { toast.error('Failed') }
  }

  const handleReviewLog = async (logId) => {
    try {
      await adminAPI.reviewFraudLog(logId)
      setFraudLogs(fraudLogs.map(l => l.id === logId ? { ...l, is_reviewed: true } : l))
      toast.success('Marked as reviewed')
    } catch { toast.error('Failed') }
  }

  const tabs = ['overview', 'users', 'tasks', 'sessions', 'skill-verifications', 'session-feedback', 'task-feedback', 'fraud-logs']

  return (
    <div className="p-8 animate-slide-up">
      <div className="mb-8">
        <h1 className="page-header">System Controller</h1>
        <p className="text-gray-500 text-sm mt-1">Platform administration & oversight</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-card border border-surface-border rounded-xl p-1 w-fit mb-6">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all
              ${tab === t ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            {t.replace('-', ' ')}
            {t === 'fraud-logs' && stats?.fraud_alerts > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {stats.fraud_alerts}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-400" size={28} /></div>
      ) : (
        <>
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={Users}       label="Total Users"    value={stats.total_users}   color="brand" />
                <StatCard icon={CheckCircle} label="Active Users"   value={stats.active_users}  color="green" />
                <StatCard icon={Calendar}    label="Total Sessions" value={stats.total_sessions} color="purple" />
                <StatCard icon={ShoppingBag} label="Total Tasks"    value={stats.total_tasks}    color="yellow" />
                <StatCard icon={DollarSign}  label="Revenue (₹)"    value={`₹${stats.total_revenue?.toFixed(0)}`} color="green" />
                <StatCard icon={AlertTriangle} label="Fraud Alerts" value={stats.fraud_alerts}  color="red" />
              </div>
            </div>
          )}

          {tab === 'users' && (
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
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'tasks' && (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-hover">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Task</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Posted by</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Budget</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => (
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
                      <td className="px-4 py-3">
                        {!t.is_flagged && (
                          <button onClick={() => handleFlagTask(t.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1">
                            <Flag size={11} /> Flag
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'sessions' && (
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
          )}

          {tab === 'skill-verifications' && (
            <div className="card overflow-hidden">
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
          )}

          {tab === 'session-feedback' && (
            <div className="card overflow-hidden">
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
          )}

          {tab === 'task-feedback' && (
            <div className="card overflow-hidden">
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
          )}

          {tab === 'fraud-logs' && (
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
          )}
        </>
      )}
    </div>
  )
}
