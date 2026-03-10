import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Clock, DollarSign, ChevronRight, Loader2, Tag, Filter, CheckCircle2 } from 'lucide-react'
import { paymentsAPI, tasksAPI } from '../utils/api'
import { getAccessToken } from '../utils/authStorage'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

const statusColors = {
  open: 'badge-green', assigned: 'badge-blue', submitted: 'badge-yellow',
  completed: 'badge-gray', disputed: 'badge-red', flagged: 'badge-red',
}

function TaskCard({ task, onAccept, onView, isMyTask }) {
  const isOpen = task.status === 'open'
  const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / 86400000)

  return (
    <div className="card p-5 hover:border-brand-500/30 transition-all duration-200 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-100 line-clamp-2 leading-snug">{task.title}</h3>
          <p className="text-xs text-gray-500 mt-1">by {task.poster?.full_name}</p>
        </div>
        <span className={`badge ${statusColors[task.status] || 'badge-gray'} shrink-0`}>{task.status}</span>
      </div>

      <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">{task.description}</p>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1"><Tag size={11} /> {task.subject}</span>
        <span className="flex items-center gap-1 text-yellow-400"><DollarSign size={11} />₹{task.budget}</span>
        <span className={`flex items-center gap-1 ${daysLeft <= 1 ? 'text-red-400' : ''}`}>
          <Clock size={11} /> {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
        </span>
      </div>

      <div className="flex gap-2 mt-auto">
        <button onClick={() => onView(task)} className="btn-secondary flex-1 text-xs py-2">
          View Details
        </button>
        {isOpen && !isMyTask && (
          <button onClick={() => onAccept(task)} className="btn-primary flex-1 text-xs py-2">
            Accept Task
          </button>
        )}
      </div>
    </div>
  )
}

function CreateTaskModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    budget: '',
    deadline: '',
    attachment_url: '',
  })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        budget: parseFloat(form.budget),
        attachment_url: form.attachment_url?.trim() || null,
      }
      const { data } = await tasksAPI.create(payload)
      onCreate(data)
      toast.success('Task posted!')
      onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg animate-slide-up">
        <div className="p-6 border-b border-surface-border">
          <h2 className="section-title">Post a Task</h2>
          <p className="text-gray-500 text-sm mt-1">Describe what you need help with</p>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="label">Task Title</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input" placeholder="e.g. Help with Machine Learning assignment" required minLength={10} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input min-h-24 resize-none" placeholder="Describe the task in detail..." required minLength={20} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Subject</label>
              <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="input" placeholder="e.g. Data Science" required />
            </div>
            <div>
              <label className="label">Budget (₹)</label>
              <input type="number" min="1" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="input" placeholder="500" required />
            </div>
          </div>
          <div>
            <label className="label">Deadline</label>
            <input type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="input" required />
          </div>
          <div>
            <label className="label">Attachment URL (optional)</label>
            <input value={form.attachment_url} onChange={e => setForm({...form, attachment_url: e.target.value})} className="input" placeholder="https://drive.google.com/..." />
            <p className="mt-1 text-xs text-gray-500">Upload the file to Drive or any host and paste the share link here.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Post Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskDetailModal({ task, onClose, onAccept, onSubmit, onPay, onWalletPay, onFeedback, currentUserId }) {
  const [submitNotes, setSubmitNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState({ rating: 5, review: '' })
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const isAcceptor = task.acceptor?.id === currentUserId
  const isPoster = task.poster?.id === currentUserId

  const handleSubmit = async () => {
    setLoading(true)
    try { await onSubmit(task.id, submitNotes); toast.success('Task submitted!'); onClose() }
    catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  const handleFeedback = async () => {
    setFeedbackLoading(true)
    try {
      await onFeedback(task.id, feedback)
      toast.success('Feedback submitted!')
      onClose()
    } catch {
      toast.error('Failed to submit feedback')
    } finally {
      setFeedbackLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center justify-between">
            <h2 className="section-title line-clamp-1">{task.title}</h2>
            <span className={`badge ${statusColors[task.status]} shrink-0`}>{task.status}</span>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed">{task.description}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-hover rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Budget</p>
              <p className="font-bold text-green-400">₹{task.budget}</p>
            </div>
            <div className="bg-surface-hover rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Subject</p>
              <p className="font-medium text-gray-200 text-sm">{task.subject}</p>
            </div>
            <div className="bg-surface-hover rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Deadline</p>
              <p className="font-medium text-gray-200 text-sm">{new Date(task.deadline).toLocaleDateString()}</p>
            </div>
          </div>

          {task.attachment_url && (
            <div className="rounded-xl border border-surface-border bg-surface-hover p-3 text-sm text-gray-300">
              Attachment:{' '}
              <a href={task.attachment_url} target="_blank" rel="noreferrer" className="text-brand-300 hover:text-white">
                View file
              </a>
            </div>
          )}

          {task.status === 'assigned' && isAcceptor && (
            <div>
              <label className="label">Submission Notes</label>
              <textarea value={submitNotes} onChange={e => setSubmitNotes(e.target.value)} className="input resize-none" rows={3} placeholder="Describe your submission..." />
              <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Submit Task
              </button>
            </div>
          )}

          {task.status === 'submitted' && isPoster && (
            <div className="space-y-3">
              <button onClick={() => onPay(task)} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                <CheckCircle2 size={16} />
                Pay via Razorpay
              </button>
              <button onClick={() => onWalletPay(task)} className="btn-secondary w-full inline-flex items-center justify-center gap-2">
                Use Wallet Credit
              </button>
              <div className="rounded-xl border border-surface-border bg-surface-hover p-4 text-xs text-gray-400">
                <p className="text-sm font-semibold text-white">UPI Demo</p>
                <div className="mt-2 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg border border-white/10 bg-[linear-gradient(135deg,#1a2034,#0f121d)] flex items-center justify-center text-[10px] text-gray-400">
                    UPI QR
                  </div>
                  <div>
                    <p>UPI ID: talentconnect@upi (demo)</p>
                    <p>Apps: GPay, PhonePe, Paytm (demo)</p>
                    <p>Use Razorpay for real test payments.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {task.status === 'completed' && isPoster && !task.feedback && (
            <div className="rounded-xl border border-surface-border bg-surface-hover p-4">
              <p className="text-sm font-semibold text-white">Leave feedback</p>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setFeedback(prev => ({ ...prev, rating: value }))}
                    className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors
                      ${feedback.rating === value ? 'border-brand-500 bg-brand-500/20 text-brand-200' : 'border-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <textarea
                value={feedback.review}
                onChange={(e) => setFeedback(prev => ({ ...prev, review: e.target.value }))}
                className="input mt-3 resize-none"
                rows={3}
                placeholder="Share your experience (optional)"
              />
              <button
                onClick={handleFeedback}
                disabled={feedbackLoading}
                className="btn-primary mt-3 w-full flex items-center justify-center gap-2"
              >
                {feedbackLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                Submit Feedback
              </button>
            </div>
          )}

          {task.status === 'completed' && isPoster && task.feedback && (
            <div className="rounded-xl border border-surface-border bg-surface-hover p-4 text-sm text-gray-300">
              <p className="text-sm font-semibold text-white">Your feedback</p>
              <p className="mt-2">Rating: {task.feedback.rating}/5</p>
              {task.feedback.review ? <p className="mt-1 text-gray-400">{task.feedback.review}</p> : null}
            </div>
          )}
        </div>
        <div className="p-6 pt-0">
          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </div>
    </div>
  )
}

export default function Marketplace() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('browse')
  const [showCreate, setShowCreate] = useState(false)
  const [viewTask, setViewTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payingTaskId, setPayingTaskId] = useState(null)
  const [demoLoading, setDemoLoading] = useState(false)

  const handleAuthFailure = (e, fallbackMessage = 'Failed') => {
    const status = e.response?.status
    const hasToken = Boolean(getAccessToken())
    if ((status === 401 || status === 403) && !hasToken) {
      toast.error('Please sign in again.')
      navigate('/login', { replace: true })
      return true
    }
    toast.error(e.response?.data?.detail || fallbackMessage)
    return false
  }

  useEffect(() => {
    Promise.all([tasksAPI.list(), tasksAPI.my()])
      .then(([all, my]) => { setTasks(all.data); setMyTasks(my.data) })
      .catch((e) => {
        handleAuthFailure(e, 'Failed to load tasks')
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const handleAccept = async (task) => {
    try {
      const { data } = await tasksAPI.accept(task.id)
      setTasks(prev => prev.map(t => t.id === task.id ? data : t))
      toast.success('Task accepted!')
    } catch (e) {
      handleAuthFailure(e)
    }
  }

  const handleSubmit = async (taskId, notes) => {
    const { data } = await tasksAPI.submit(taskId, { submission_notes: notes })
    setMyTasks(prev => prev.map(t => t.id === taskId ? data : t))
  }

  const handleFeedback = async (taskId, feedback) => {
    const { data } = await tasksAPI.feedback(taskId, feedback)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, feedback: data } : t))
    setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, feedback: data } : t))
  }

  const handleWalletPay = async (task) => {
    if (payingTaskId) return
    setPayingTaskId(task.id)
    try {
      const { data } = await paymentsAPI.walletPay({ task_id: task.id })
      setMyTasks(prev => prev.map(t => t.id === task.id ? data : t))
      toast.success('Wallet payment successful. Task marked complete.')
      setViewTask(null)
    } catch (e) {
      handleAuthFailure(e, 'Wallet payment failed')
    } finally {
      setPayingTaskId(null)
    }
  }

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const openCheckout = async ({ taskId, taskTitle, order }) => {
    const options = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: 'TalentConnect',
      description: `Payment for task: ${taskTitle}`,
      order_id: order.order_id,
      handler: async (response) => {
        try {
          const { data } = await paymentsAPI.verify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            task_id: taskId,
          })
          setMyTasks(prev => prev.map(t => t.id === taskId ? data : t))
          toast.success('Payment successful. Task marked complete.')
          setViewTask(null)
        } catch (e) {
          toast.error(e.response?.data?.detail || 'Payment verification failed')
        }
      },
      theme: { color: '#4f52e5' },
    }

    const rz = new window.Razorpay(options)
    rz.on('payment.failed', () => {
      toast.error('Payment failed or cancelled')
    })
    rz.open()
  }

  const handlePay = async (task) => {
    if (payingTaskId) return
    setPayingTaskId(task.id)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) {
        toast.error('Failed to load Razorpay')
        return
      }

      const { data: order } = await paymentsAPI.createOrder({ task_id: task.id })
      await openCheckout({ taskId: task.id, taskTitle: task.title, order })
    } catch (e) {
      handleAuthFailure(e, 'Payment failed')
    } finally {
      setPayingTaskId(null)
    }
  }

  const runDemoPayment = async () => {
    if (demoLoading) return
    setDemoLoading(true)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) {
        toast.error('Failed to load Razorpay')
        return
      }

      const { data: demo } = await paymentsAPI.demoOrder()
      toast.success('Demo task created. Opening Razorpay...')
      await openCheckout({ taskId: demo.task_id, taskTitle: demo.task_title, order: demo })

      const [all, mine] = await Promise.all([tasksAPI.list(), tasksAPI.my()])
      setTasks(all.data)
      setMyTasks(mine.data)
    } catch (e) {
      handleAuthFailure(e, 'Demo payment failed')
    } finally {
      setDemoLoading(false)
    }
  }

  const displayTasks = tab === 'browse' ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase())) : myTasks

  return (
    <div className="p-8 animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-header">Task Marketplace</h1>
          <p className="text-gray-500 text-sm mt-1">Post tasks or earn by helping others</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Post Task
        </button>
      </div>

        <div className="card p-5 mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Razorpay Test Mode</p>
            <p className="text-xs text-gray-400 mt-1">
              Use Razorpay test keys and a test card to validate payments. This demo creates a ₹1 task, submits it, and opens checkout.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              For a full transfer, use two accounts: one posts the task and pays, the other accepts and submits it.
            </p>
            <div className="mt-3 text-xs text-gray-400 space-y-1">
              <p>Test card: 4111 1111 1111 1111</p>
              <p>Expiry: Any future date · CVV: 123 · OTP: 123456</p>
            </div>
        </div>
        <button
          onClick={runDemoPayment}
          disabled={demoLoading}
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          {demoLoading ? <Loader2 size={16} className="animate-spin" /> : null}
          Run Demo Payment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-card border border-surface-border rounded-xl p-1 w-fit mb-6">
        {['browse', 'my-tasks'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
              ${tab === t ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            {t === 'browse' ? 'Browse Tasks' : 'My Tasks'}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="input pl-9 max-w-sm" />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-400" size={28} /></div>
      ) : displayTasks.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">No tasks found</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 inline-flex">Post a Task</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onAccept={handleAccept}
              onView={setViewTask}
              isMyTask={task.poster?.id === user?.id}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} onCreate={t => setTasks([t, ...tasks])} />}
      {viewTask && (
        <TaskDetailModal
          task={viewTask}
          onClose={() => setViewTask(null)}
          onAccept={handleAccept}
          onSubmit={handleSubmit}
          onPay={handlePay}
          onWalletPay={handleWalletPay}
          onFeedback={handleFeedback}
          currentUserId={user?.id}
        />
      )}
    </div>
  )
}
