import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, Video, Star, CheckCircle, XCircle, Clock, Loader2, Plus, Search, BookOpen } from 'lucide-react'
import { sessionsAPI, skillsAPI, paymentsAPI } from '../utils/api'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

const statusColors = {
  pending: 'badge-yellow', confirmed: 'badge-blue',
  completed: 'badge-green', cancelled: 'badge-red',
}

function SessionCard({ session, userId, onConfirm, onCancel, onComplete, onFeedback }) {
  const isMentor = session.mentor?.id === userId
  const isLearner = session.learner?.id === userId
  const isPending = session.status === 'pending'
  const isConfirmed = session.status === 'confirmed'
  const isCompleted = session.status === 'completed'

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
          <button onClick={() => onConfirm(session.id)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            <CheckCircle size={12} /> Confirm
          </button>
        )}
        {isMentor && isConfirmed && (
          <button onClick={() => onComplete(session.id)} className="btn-primary text-xs px-3 py-1.5">
            Mark Complete
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
            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
          >
            <XCircle size={12} className="inline mr-1" /> Cancel
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
          {mentor.avg_rating ? (
            <p className="text-sm font-semibold text-yellow-400">{mentor.avg_rating.toFixed(1)}★</p>
          ) : null}
          <p className="text-xs text-gray-500">{mentor.total_sessions} sessions</p>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg animate-slide-up">
        <div className="p-6 border-b border-surface-border">
          <h2 className="section-title">Book {mentor.user.full_name}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {mentor.user_skill.skill.name} · ₹{mentor.user_skill.hourly_rate || 0}/hr
          </p>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
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

function PaymentModal({ amount, walletBalance, onConfirm, onClose }) {
  const [method, setMethod] = useState('wallet')
  const formattedAmount = `₹${amount.toFixed(2)}`

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-3xl overflow-hidden">
        <div className="grid md:grid-cols-[240px_1fr]">
          <div className="border-r border-surface-border bg-surface-hover p-5">
            <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">Payment Method</p>
            <div className="mt-4 space-y-2">
              {['card', 'netbanking', 'wallet', 'upi'].map((item) => (
                <button
                  key={item}
                  onClick={() => setMethod(item)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    method === item ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item === 'card' && 'Credit / Debit Card'}
                  {item === 'netbanking' && 'Netbanking'}
                  {item === 'wallet' && 'Wallet'}
                  {item === 'upi' && 'UPI'}
                </button>
              ))}
            </div>
            <p className="mt-6 text-xs text-gray-500">Amount payable</p>
            <p className="text-xl font-semibold text-white">{formattedAmount}</p>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-semibold text-white">Pay with {method.toUpperCase()}</h3>

            {method === 'card' && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="label">Card Number</label>
                  <input className="input" placeholder="4111 1111 1111 1111" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Expiry</label>
                    <input className="input" placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="label">CVV</label>
                    <input className="input" placeholder="123" />
                  </div>
                  <div>
                    <label className="label">Name</label>
                    <input className="input" placeholder="Cardholder" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Demo only. No real charges will be made.</p>
              </div>
            )}

            {method === 'netbanking' && (
              <div className="mt-4 space-y-3">
                <label className="label">Select Bank</label>
                <select className="input">
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>State Bank of India</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra</option>
                </select>
                <p className="text-xs text-gray-500">Demo only. This simulates a netbanking flow.</p>
              </div>
            )}

            {method === 'wallet' && (
              <div className="mt-4 space-y-3 text-sm text-gray-400">
                <p>Wallet balance: ₹{walletBalance.toFixed(2)}</p>
                <p>Use wallet credits to confirm this session instantly.</p>
              </div>
            )}

            {method === 'upi' && (
              <div className="mt-4 grid gap-3 md:grid-cols-[120px_1fr] items-center">
                <div className="h-28 w-28 rounded-xl border border-white/10 bg-[linear-gradient(135deg,#1a2034,#0f121d)] flex items-center justify-center text-[10px] text-gray-400">
                  UPI QR
                </div>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>
                    <label className="label">UPI ID</label>
                    <input className="input" placeholder="talentconnect@upi" />
                  </div>
                  <p>Apps supported: GPay, PhonePe, Paytm (demo)</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => onConfirm(method)} className="btn-primary flex-1">
                Pay Now
              </button>
            </div>
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
        setMentors(data.filter((mentor) => mentor.user?.id !== user?.id))
      })
      .catch((e) => toast.error(e.response?.data?.detail || 'Failed to load mentors'))
      .finally(() => setMentorLoading(false))
  }, [selectedSkillId, user?.id])

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter)

  const handleConfirm = async (id) => {
    try { const {data} = await sessionsAPI.confirm(id); setSessions(sessions.map(s => s.id === id ? data : s)); toast.success('Session confirmed!') }
    catch { toast.error('Failed') }
  }
  const handleCancel = async (id) => {
    const reason = prompt('Reason for cancellation?')
    if (!reason) return
    try { const {data} = await sessionsAPI.cancel(id, {reason}); setSessions(sessions.map(s => s.id === id ? data : s)); toast.success('Cancelled') }
    catch { toast.error('Failed') }
  }
  const handleComplete = async (id) => {
    try { const {data} = await sessionsAPI.complete(id); setSessions(sessions.map(s => s.id === id ? data : s)); toast.success('Session completed!') }
    catch { toast.error('Failed') }
  }
  const handleFeedback = async (sessionId, data) => {
    await sessionsAPI.feedback(sessionId, data)
    setSessions(sessions.map(s => s.id === sessionId ? {...s, feedback: data} : s))
  }

  const handleBooked = (payload) => {
    setPendingBooking(payload)
    setShowPayment(true)
  }

  const handlePaymentConfirm = async (method) => {
    if (!pendingBooking) return
    const rate = pendingBooking.mentor.user_skill.hourly_rate || 0
    const amount = (rate * pendingBooking.form.duration_minutes) / 60
    if (method === 'wallet' && walletBalance < amount) {
      toast.error('Insufficient wallet balance')
      return
    }
    try {
      if (amount > 0 && method === 'wallet') {
        const { data: wallet } = await paymentsAPI.walletDebit({
          amount,
          description: `Session booking with ${pendingBooking.mentor.user.full_name}`,
          reference_id: `session-${pendingBooking.mentor.user.id}`,
        })
        setWalletBalance(wallet.balance)
      }
      const { data } = await sessionsAPI.book(pendingBooking.form)
      setSessions((prev) => [data, ...prev])
      setFilter('all')
      toast.success('Session booked successfully')
      setShowPayment(false)
      setPendingBooking(null)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Payment failed')
    }
  }

  return (
    <div className="p-8 animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-header">My Sessions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your learning sessions</p>
        </div>
        <div className="text-xs text-gray-400">
          Wallet balance: <span className="text-brand-300 font-semibold">₹{walletBalance.toFixed(2)}</span>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="section-title">Find a Mentor</h2>
            <p className="text-gray-500 text-sm mt-1">Choose a skill and book a session with a mentor.</p>
          </div>
          <button onClick={() => navigate('/skills')} className="btn-secondary text-sm">
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
              <div className="rounded-2xl border border-surface-border bg-surface-hover/50 p-8 text-center">
                <BookOpen size={28} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Select a skill to see available mentors.</p>
              </div>
            ) : mentorLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-brand-400" size={28} /></div>
            ) : mentors.length === 0 ? (
              <div className="rounded-2xl border border-surface-border bg-surface-hover/50 p-8 text-center">
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
      <div className="flex gap-1 bg-surface-card border border-surface-border rounded-xl p-1 w-fit mb-6">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
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
          amount={(pendingBooking.mentor.user_skill.hourly_rate || 0) * pendingBooking.form.duration_minutes / 60}
          walletBalance={walletBalance}
          onConfirm={handlePaymentConfirm}
          onClose={() => {
            setShowPayment(false)
            setPendingBooking(null)
          }}
        />
      )}
    </div>
  )
}
