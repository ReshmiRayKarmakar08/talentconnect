import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Calendar, Video, Star, CheckCircle, XCircle, Clock, Loader2, Plus,
  Search, BookOpen, Wallet, CreditCard, ShieldCheck, AlertCircle, X
} from 'lucide-react'
import { sessionsAPI, skillsAPI, paymentsAPI } from '../utils/api'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

const statusColors = {
  pending: 'badge-yellow', confirmed: 'badge-blue',
  completed: 'badge-green', cancelled: 'badge-red',
}

function SessionCard({ session, userId, onConfirm, onCancel, onComplete, onFeedback, actionLoadingId }) {
  const isMentor = session.mentor?.id === userId
  const isLearner = session.learner?.id === userId
  const isPending = session.status === 'pending'
  const isConfirmed = session.status === 'confirmed'
  const isCompleted = session.status === 'completed'
  const isCurrentAction = actionLoadingId === session.id

  return (
    <div className="card p-5 hover:border-brand-500/20 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-gray-100">{session.skill?.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isMentor ? `Learner: ${session.learner?.full_name}` : `Mentor: ${session.mentor?.full_name}`}
          </p>
        </div>
        <span className={`badge ${statusColors[session.status]}`}>{session.status}</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1.5">
          <Calendar size={11} /> {new Date(session.scheduled_at).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={11} /> {new Date(session.scheduled_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
        </span>
        <span>{session.duration_minutes} min</span>
      </div>

      {session.meet_link && isConfirmed && (
        <a href={session.meet_link} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 mb-4 transition-colors">
          <Video size={14} /> Join Meeting
        </a>
      )}

      <div className="flex flex-wrap gap-2">
        {isMentor && isPending && (
          <button
            onClick={() => onConfirm(session.id)}
            disabled={isCurrentAction}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
          >
            {isCurrentAction ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Confirm
          </button>
        )}
        {isMentor && isConfirmed && (
          <button
            onClick={() => onComplete(session.id)}
            disabled={isCurrentAction}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
          >
            {isCurrentAction ? <Loader2 size={12} className="animate-spin" /> : null} Mark Complete
          </button>
        )}
        {isCompleted && isLearner && !session.feedback && (
          <button onClick={() => onFeedback(session)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
            <Star size={12} /> Leave Feedback
          </button>
        )}
        {(isPending || isConfirmed) && (
          <button
            onClick={() => onCancel(session.id)}
            disabled={isCurrentAction}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center gap-1"
          >
            {isCurrentAction ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Cancel
          </button>
        )}
      </div>
    </div>
  )
}

function FeedbackModal({ session, onClose, onSubmit }) {
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try { await onSubmit(session.id, { rating, review }); toast.success('Feedback submitted!'); onClose() }
    catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md animate-slide-up p-6">
        <h2 className="section-title mb-1">Leave Feedback</h2>
        <p className="text-gray-500 text-sm mb-5">How was your session with {session.mentor?.full_name}?</p>
        <div className="flex gap-2 mb-4">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-110">
              <Star size={28} className={n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
            </button>
          ))}
        </div>
        <textarea value={review} onChange={e => setReview(e.target.value)} className="input resize-none mb-4" rows={3} placeholder="Share your experience..." />
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : null} Submit
          </button>
        </div>
      </div>
    </div>
  )
}

function MentorDiscoveryCard({ mentor, onBook }) {
  const verificationStatus = mentor.user_skill?.verification_status

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-gray-100">{mentor.user?.full_name}</p>
          <p className="text-xs text-gray-500 mt-1">
            @{mentor.user?.username} · {mentor.user?.college || 'Student mentor'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-yellow-400">
            {(mentor.avg_rating || mentor.user?.reputation_score || 4.8).toFixed(1)}★
          </p>
          <p className="text-xs text-gray-500">
            {mentor.total_sessions || Math.max(1, Math.round(((mentor.avg_rating || mentor.user?.reputation_score || 4.8) - 4.0) * 10))} sessions
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="badge badge-blue">{mentor.user_skill?.level}</span>
        <span className={verificationStatus === 'verified' ? 'badge badge-green' : 'badge badge-yellow'}>
          {verificationStatus}
        </span>
        {mentor.user_skill?.hourly_rate ? (
          <span className="badge badge-gray">₹{mentor.user_skill.hourly_rate}/hr</span>
        ) : null}
      </div>
      <button onClick={() => onBook(mentor)} className="btn-primary w-full">
        Book Session
      </button>
    </div>
  )
}

function BookSessionModal({ mentor, onClose, onBooked }) {
  const [form, setForm] = useState({
    scheduled_at: '',
    duration_minutes: 60,
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onBooked({
        mentor,
        form: {
          mentor_id: mentor.user.id,
          skill_id: mentor.user_skill.skill.id,
          scheduled_at: form.scheduled_at,
          duration_minutes: Number(form.duration_minutes),
          notes: form.notes,
        },
      })
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to book session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="p-4 sm:p-6 border-b border-surface-border">
          <h2 className="section-title">Book {mentor.user.full_name}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {mentor.user_skill.skill.name} · ₹{mentor.user_skill.hourly_rate || 0}/hr
          </p>
        </div>
        <form onSubmit={submit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="label">Date & Time</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Duration</label>
            <select
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              className="input"
            >
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input resize-none"
              rows={3}
              placeholder="Mention your topic, goals, or doubts..."
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Request Session
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ensureRazorpayLoaded = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(true)
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function PaymentModal({ pendingBooking, amount, walletBalance, isProcessing, onConfirm, onClose }) {
  const [method, setMethod] = useState('wallet')
  const formattedAmount = `₹${amount.toFixed(2)}`
  const hasSufficientBalance = walletBalance >= amount
  const mentorName = pendingBooking?.mentor?.user?.full_name || 'Mentor'
  const skillName = pendingBooking?.mentor?.user_skill?.skill?.name || 'Session'
  const scheduledTime = pendingBooking?.form?.scheduled_at
    ? new Date(pendingBooking.form.scheduled_at).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : ''
  const duration = pendingBooking?.form?.duration_minutes || 60

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in">
      <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto border-surface-border bg-[#121624] shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-surface-border flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-display">Confirm & Pay for Session</h2>
            <p className="text-xs text-gray-400 mt-1">
              {skillName} with <span className="text-brand-300 font-medium">{mentorName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-40 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Session details overview */}
        <div className="px-4 sm:px-6 py-3.5 bg-surface-hover/70 border-b border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs text-gray-300">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-gray-400">
              <Calendar size={13} className="text-brand-400" />
              {scheduledTime}
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <Clock size={13} className="text-brand-400" />
              {duration} minutes
            </span>
          </div>
          <div className="text-right">
            <span className="text-gray-400 mr-2">Total:</span>
            <span className="text-base font-bold text-white font-display">{formattedAmount}</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Choose Payment Method
          </p>

          {/* Option 1: TalentConnect Wallet */}
          <div
            onClick={() => !isProcessing && setMethod('wallet')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              method === 'wallet'
                ? 'border-brand-500 bg-brand-500/10 shadow-sm shadow-brand-500/10 ring-1 ring-brand-500'
                : 'border-surface-border bg-surface-hover hover:border-gray-600'
            } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  method === 'wallet' ? 'bg-brand-500 text-white' : 'bg-surface-border text-gray-400'
                }`}>
                  <Wallet size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm">TalentConnect Wallet</p>
                    <span className="badge badge-blue text-[10px] py-0.5">Instant Booking</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Current balance: <span className="font-semibold text-gray-200">₹{walletBalance.toFixed(2)}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                {amount === 0 ? (
                  <span className="badge badge-green text-xs">Free</span>
                ) : hasSufficientBalance ? (
                  <span className="badge badge-green text-xs">Sufficient</span>
                ) : (
                  <span className="badge badge-yellow text-xs">Needs ₹{(amount - walletBalance).toFixed(2)} more</span>
                )}
              </div>
            </div>

            {method === 'wallet' && !hasSufficientBalance && amount > 0 && (
              <div className="mt-3 pt-3 border-t border-yellow-500/20 text-xs text-yellow-300/90 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 text-yellow-400 mt-0.5" />
                <span>
                  Insufficient balance. You can switch to Razorpay Gateway below to pay directly with UPI, Cards, or Netbanking.
                </span>
              </div>
            )}
          </div>

          {/* Option 2: Razorpay Gateway */}
          <div
            onClick={() => !isProcessing && setMethod('razorpay')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              method === 'razorpay'
                ? 'border-brand-500 bg-brand-500/10 shadow-sm shadow-brand-500/10 ring-1 ring-brand-500'
                : 'border-surface-border bg-surface-hover hover:border-gray-600'
            } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  method === 'razorpay' ? 'bg-indigo-600 text-white' : 'bg-surface-border text-gray-400'
                }`}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm">Razorpay Gateway</p>
                    <span className="badge badge-green text-[10px] py-0.5">UPI • Cards • Netbanking</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Pay directly with Google Pay, PhonePe, Paytm, Cards, or Netbanking
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <ShieldCheck size={16} />
                <span>Secured</span>
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="btn-secondary flex-1 py-3 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(method)}
              disabled={isProcessing || (method === 'wallet' && !hasSufficientBalance && amount > 0)}
              className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : method === 'wallet' ? (
                !hasSufficientBalance && amount > 0 ? (
                  'Insufficient Wallet Balance'
                ) : (
                  `Pay ${formattedAmount} with Wallet`
                )
              ) : (
                `Pay ${formattedAmount} via Razorpay`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sessions() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [sessions, setSessions] = useState([])
  const [skills, setSkills] = useState([])
  const [selectedSkillId, setSelectedSkillId] = useState(searchParams.get('skill') || '')
  const [mentors, setMentors] = useState([])
  const [mentorLoading, setMentorLoading] = useState(false)
  const [bookMentor, setBookMentor] = useState(null)
  const [pendingBooking, setPendingBooking] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [feedbackSession, setFeedbackSession] = useState(null)
  const [filter, setFilter] = useState('all')
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  useEffect(() => {
    Promise.all([
      sessionsAPI.my(),
      skillsAPI.list(),
      paymentsAPI.wallet(),
    ])
      .then(([sessionRes, skillRes, walletRes]) => {
        setSessions(sessionRes.data)
        setSkills(skillRes.data)
        setWalletBalance(walletRes.data?.balance || 0)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedSkillId) {
      setMentors([])
      return
    }

    setMentorLoading(true)
    skillsAPI.getMentors(selectedSkillId)
      .then(({ data }) => {
        const otherMentors = data.filter((mentor) => mentor.user?.id !== user?.id)
        setMentors(otherMentors.length > 0 ? otherMentors : data)
      })
      .catch((e) => toast.error(e.response?.data?.detail || 'Failed to load mentors'))
      .finally(() => setMentorLoading(false))
  }, [selectedSkillId, user?.id])

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter)

  const handleConfirm = async (id) => {
    if (actionLoadingId) return
    setActionLoadingId(id)
    try {
      const { data } = await sessionsAPI.confirm(id)
      setSessions(sessions.map(s => s.id === id ? data : s))
      toast.success('Session confirmed!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to confirm session')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCancel = async (id) => {
    if (actionLoadingId) return
    const reason = prompt('Reason for cancellation?')
    if (!reason) return
    setActionLoadingId(id)
    try {
      const { data } = await sessionsAPI.cancel(id, { reason })
      setSessions(sessions.map(s => s.id === id ? data : s))
      toast.success('Session cancelled')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to cancel session')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleComplete = async (id) => {
    if (actionLoadingId) return
    setActionLoadingId(id)
    try {
      const { data } = await sessionsAPI.complete(id)
      setSessions(sessions.map(s => s.id === id ? data : s))
      toast.success('Session completed!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to complete session')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleFeedback = async (sessionId, data) => {
    await sessionsAPI.feedback(sessionId, data)
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, feedback: data } : s))
  }

  const handleBooked = (payload) => {
    setPendingBooking(payload)
    setShowPayment(true)
  }

  const handlePaymentConfirm = async (method) => {
    if (isProcessing || !pendingBooking) return
    setIsProcessing(true)

    const rate = pendingBooking.mentor.user_skill.hourly_rate || 0
    const amount = (rate * pendingBooking.form.duration_minutes) / 60

    if (method === 'wallet') {
      if (amount > 0 && walletBalance < amount) {
        toast.error('Insufficient wallet balance. Please pay via Razorpay or top up your wallet.')
        setIsProcessing(false)
        return
      }

      const bookingToast = toast.loading('Booking session with wallet...')
      try {
        const { data: bookedSession } = await sessionsAPI.bookWallet(pendingBooking.form)
        try {
          const { data: wRes } = await paymentsAPI.wallet()
          setWalletBalance(wRes.balance)
        } catch {}

        setSessions((prev) => [bookedSession, ...prev])
        setFilter('all')
        toast.success('Session booked and confirmed with wallet!', { id: bookingToast })
        setShowPayment(false)
        setPendingBooking(null)
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to book session', { id: bookingToast })
      } finally {
        setIsProcessing(false)
      }
    } else if (method === 'razorpay') {
      const orderToast = toast.loading('Preparing Razorpay checkout...')
      try {
        const isLoaded = await ensureRazorpayLoaded()
        if (!isLoaded || !window.Razorpay) {
          toast.error('Could not load Razorpay payment gateway', { id: orderToast })
          setIsProcessing(false)
          return
        }

        const { data: order } = await paymentsAPI.sessionOrder({
          mentor_id: pendingBooking.form.mentor_id,
          skill_id: pendingBooking.form.skill_id,
          duration_minutes: pendingBooking.form.duration_minutes,
        })
        toast.dismiss(orderToast)

        const logoUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/logo.png`
          : 'https://talentconnect-web.vercel.app/logo.png'

        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'TalentConnect',
          description: `Session with ${pendingBooking.mentor.user.full_name}`,
          image: logoUrl,
          prefill: {
            name: user?.full_name || '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: {
            color: '#4f52e5',
          },
          handler: async (response) => {
            const verifyToast = toast.loading('Verifying payment & confirming session...')
            try {
              const { data: bookedSession } = await paymentsAPI.sessionVerify({
                razorpay_order_id: response.razorpay_order_id || order.order_id || '',
                razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpay_signature: response.razorpay_signature || '',
                mentor_id: pendingBooking.form.mentor_id,
                skill_id: pendingBooking.form.skill_id,
                scheduled_at: pendingBooking.form.scheduled_at,
                duration_minutes: pendingBooking.form.duration_minutes,
                notes: pendingBooking.form.notes,
              })

              try {
                const { data: wRes } = await paymentsAPI.wallet()
                setWalletBalance(wRes.balance)
              } catch {}

              setSessions((prev) => [bookedSession, ...prev])
              setFilter('all')
              toast.success('Payment verified & session booked successfully!', { id: verifyToast })
              setShowPayment(false)
              setPendingBooking(null)
            } catch (vErr) {
              toast.error(vErr.response?.data?.detail || 'Payment verification failed', { id: verifyToast })
            } finally {
              setIsProcessing(false)
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false)
              toast('Payment window closed. You can try again.')
            },
          },
        }

        if (
          order.order_id &&
          order.order_id.startsWith('order_') &&
          !order.order_id.startsWith('test_') &&
          !order.order_id.startsWith('sandbox_')
        ) {
          options.order_id = order.order_id
        }

        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', (resp) => {
          setIsProcessing(false)
          toast.error(resp.error?.description || 'Payment failed')
        })
        rzp.open()
      } catch (err) {
        setIsProcessing(false)
        toast.error(err.response?.data?.detail || 'Failed to initiate Razorpay payment', { id: orderToast })
      }
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-slide-up max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="page-header">My Sessions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your learning sessions</p>
        </div>
        <div className="text-xs text-gray-400">
          Wallet balance: <span className="text-brand-300 font-semibold">₹{walletBalance.toFixed(2)}</span>
        </div>
      </div>

      <div className="card p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="section-title">Find a Mentor</h2>
            <p className="text-gray-500 text-sm mt-1">Choose a skill and book a session with a mentor.</p>
          </div>
          <button onClick={() => navigate('/skills')} className="btn-secondary text-sm self-start sm:self-auto">
            Manage Skills
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div>
            <label className="label">Pick a skill</label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="input pl-9"
              >
                <option value="">Choose a skill</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name} ({skill.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            {!selectedSkillId ? (
              <div className="rounded-2xl border border-surface-border bg-surface-hover/50 p-6 sm:p-8 text-center">
                <BookOpen size={28} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Select a skill to see available mentors.</p>
              </div>
            ) : mentorLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-brand-400" size={28} /></div>
            ) : mentors.length === 0 ? (
              <div className="rounded-2xl border border-surface-border bg-surface-hover/50 p-6 sm:p-8 text-center">
                <p className="text-gray-400 text-sm">No mentors found for this skill yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mentors.map((mentor) => (
                  <MentorDiscoveryCard key={`${mentor.user?.id}-${mentor.user_skill?.id}`} mentor={mentor} onBook={setBookMentor} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface-card border border-surface-border rounded-xl p-1 max-w-full overflow-x-auto scrollbar-none whitespace-nowrap mb-6">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize shrink-0 transition-all
              ${filter === f ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-400" size={28} /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No sessions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => (
            <SessionCard
              key={s.id}
              session={s}
              userId={user?.id}
              actionLoadingId={actionLoadingId}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onComplete={handleComplete}
              onFeedback={setFeedbackSession}
            />
          ))}
        </div>
      )}

      {feedbackSession && (
        <FeedbackModal
          session={feedbackSession}
          onClose={() => setFeedbackSession(null)}
          onSubmit={handleFeedback}
        />
      )}

      {bookMentor && (
        <BookSessionModal
          mentor={bookMentor}
          onClose={() => setBookMentor(null)}
          onBooked={handleBooked}
        />
      )}

      {showPayment && pendingBooking && (
        <PaymentModal
          pendingBooking={pendingBooking}
          amount={(pendingBooking.mentor.user_skill.hourly_rate || 0) * pendingBooking.form.duration_minutes / 60}
          walletBalance={walletBalance}
          isProcessing={isProcessing}
          onConfirm={handlePaymentConfirm}
          onClose={() => {
            if (!isProcessing) {
              setShowPayment(false)
              setPendingBooking(null)
            }
          }}
        />
      )}
    </div>
  )
}
