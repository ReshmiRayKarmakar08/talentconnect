import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Star, CheckCircle, XCircle, Sparkles, Shield, Loader2, ChevronRight } from 'lucide-react'
import { getApiErrorMessage, skillsAPI } from '../utils/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

function MentorCard({ mentor, onBook }) {
  const vs = mentor.user_skill?.verification_status
  return (
    <div className="card p-5 hover:border-brand-500/30 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {mentor.user?.full_name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-100">{mentor.user?.full_name}</p>
            {vs === 'verified' && (
              <span className="badge badge-green"><CheckCircle size={10} /> Verified</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">@{mentor.user?.username}</p>
        </div>
        <div className="text-right shrink-0">
          {mentor.avg_rating ? (
            <div className="flex items-center gap-1 text-yellow-400">
              <Star size={13} fill="currentColor" />
              <span className="text-sm font-semibold">{mentor.avg_rating?.toFixed(1)}</span>
            </div>
          ) : null}
          <p className="text-xs text-gray-600 mt-0.5">{mentor.total_sessions} sessions</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="badge badge-blue">{mentor.user_skill?.level}</span>
          {mentor.user_skill?.hourly_rate && (
            <span className="text-xs text-gray-400">₹{mentor.user_skill.hourly_rate}/hr</span>
          )}
        </div>
        <button
          onClick={() => onBook(mentor)}
          className="btn-primary text-xs px-3 py-1.5"
        >
          Book Session
        </button>
      </div>
    </div>
  )
}

function VerificationModal({ userSkill, onClose, onVerified }) {
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    skillsAPI.getQuiz(userSkill.id)
      .then(({ data }) => { setQuiz(data); setAnswers(new Array(data.questions.length).fill(null)) })
      .catch(() => toast.error('Failed to load quiz'))
      .finally(() => setLoading(false))
  }, [])

  const submit = async () => {
    if (answers.includes(null)) return toast.error('Answer all questions first')
    setSubmitting(true)
    try {
      const { data } = await skillsAPI.submitQuiz({ user_skill_id: userSkill.id, answers })
      setResult(data)
      if (data.passed) onVerified()
    } catch { toast.error('Submission failed') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-brand-400" />
            <h2 className="section-title">Skill Verification Quiz</h2>
          </div>
          <p className="text-gray-500 text-sm mt-1">Score ≥70% to get verified. You need to answer all 5 questions.</p>
        </div>

        <div className="p-6">
          {loading && <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-400" /></div>}

          {result && (
            <div className={`p-4 rounded-xl mb-4 ${result.passed ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <div className="flex items-center gap-2">
                {result.passed ? <CheckCircle className="text-green-400" size={18} /> : <XCircle className="text-red-400" size={18} />}
                <p className={`font-medium ${result.passed ? 'text-green-400' : 'text-red-400'}`}>{result.message}</p>
              </div>
            </div>
          )}

          {quiz && !result && (
            <div className="space-y-6">
              {quiz.questions.map((q, qi) => (
                <div key={qi}>
                  <p className="text-sm font-medium text-gray-200 mb-3">
                    <span className="text-brand-400 font-bold mr-2">Q{qi + 1}.</span>{q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => {
                          const a = [...answers]; a[qi] = oi; setAnswers(a)
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all
                          ${answers[qi] === oi
                            ? 'bg-brand-600/20 border border-brand-500/50 text-brand-300'
                            : 'bg-surface-hover border border-surface-border text-gray-400 hover:border-brand-500/30'
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Close</button>
          {!result && quiz && (
            <button onClick={submit} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SkillsPage() {
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [mySkills, setMySkills] = useState([])
  const [mentors, setMentors] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [search, setSearch] = useState('')
  const [verifySkill, setVerifySkill] = useState(null)
  const [addingSkill, setAddingSkill] = useState(false)
  const [skillInputMode, setSkillInputMode] = useState('existing')
  const [newSkillForm, setNewSkillForm] = useState({
    skill_id: '',
    skill_name: '',
    category: '',
    level: 'beginner',
    is_offering: true,
    hourly_rate: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([skillsAPI.list(), skillsAPI.mySkills(), skillsAPI.recommendations()])
      .then(([s, my, rec]) => {
        setSkills(s.data); setMySkills(my.data); setRecommendations(rec.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const loadMentors = async (skillId) => {
    setSelectedSkill(skillId)
    const { data } = await skillsAPI.getMentors(skillId)
    setMentors(data)
  }

  const addSkill = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        level: newSkillForm.level,
        is_offering: true,
        hourly_rate: newSkillForm.hourly_rate ? parseFloat(newSkillForm.hourly_rate) : null,
      }

      if (skillInputMode === 'existing') {
        if (!newSkillForm.skill_id) {
          toast.error('Please select a skill first.')
          return
        }
        payload.skill_id = parseInt(newSkillForm.skill_id, 10)
      } else {
        if (!newSkillForm.skill_name.trim()) {
          toast.error('Please enter a skill name.')
          return
        }
        payload.skill_name = newSkillForm.skill_name.trim()
        payload.category = newSkillForm.category.trim() || 'General'
      }

      const { data } = await skillsAPI.addSkill(payload)
      setMySkills([...mySkills, data])
      if (!skills.some((s) => s.id === data.skill?.id)) {
        setSkills((prev) => [...prev, data.skill].sort((a, b) => {
          if (a.category === b.category) return a.name.localeCompare(b.name)
          return a.category.localeCompare(b.category)
        }))
      }
      setNewSkillForm({
        skill_id: '',
        skill_name: '',
        category: '',
        level: 'beginner',
        is_offering: true,
        hourly_rate: '',
      })
      setSkillInputMode('existing')
      setAddingSkill(false)
      toast.success('Skill added! Take the verification quiz.')
    } catch (e) { toast.error(getApiErrorMessage(e, 'Failed to add skill')) }
  }

  const filtered = skills.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase()))
  const grouped = filtered.reduce((acc, s) => { (acc[s.category] = acc[s.category] || []).push(s); return acc }, {})

  return (
    <div className="p-8 animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-header">Skills Exchange</h1>
          <p className="text-gray-500 text-sm mt-1">Discover mentors, list your skills, get verified</p>
        </div>
        <button onClick={() => setAddingSkill(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add My Skill
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Skill browser */}
        <div className="lg:col-span-1">
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="input pl-9 text-sm"
            />
          </div>

          <div className="card overflow-hidden max-h-96 overflow-y-auto">
            {Object.entries(grouped).map(([cat, catSkills]) => (
              <div key={cat}>
                <div className="px-4 py-2 bg-surface-hover">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{cat}</p>
                </div>
                {catSkills.map(skill => (
                  <button
                    key={skill.id}
                    onClick={() => loadMentors(skill.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center justify-between group
                      ${selectedSkill === skill.id ? 'bg-brand-600/15 text-brand-300' : 'text-gray-400 hover:bg-surface-hover hover:text-gray-200'}`}
                  >
                    {skill.name}
                    <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <div className="card p-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-brand-400" />
                <p className="text-sm font-semibold text-gray-200">AI Recommendations</p>
              </div>
              {recommendations.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <p className="text-xs text-gray-300">{r.skill?.name}</p>
                  <span className="text-xs text-brand-400">{Math.round((r.confidence || 0.5) * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Mentors + My Skills */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mentors */}
          {selectedSkill ? (
            <div>
              <h2 className="section-title mb-4">Available Mentors</h2>
              {mentors.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-gray-500 text-sm">No verified mentors for this skill yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentors.map((m, i) => (
                    <MentorCard
                      key={i}
                      mentor={m}
                      onBook={(mentor) => navigate(`/sessions?discover=1&skill=${mentor.user_skill?.skill?.id || selectedSkill}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <BookOpen size={32} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Select a skill to browse mentors</p>
            </div>
          )}

          {/* My Skills */}
          <div>
            <h2 className="section-title mb-4">My Skills</h2>
            {mySkills.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-gray-500 text-sm">No skills listed yet.</p>
                <button onClick={() => setAddingSkill(true)} className="btn-primary mt-3 text-sm inline-flex">
                  Add Your First Skill
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mySkills.map(us => (
                  <div key={us.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-200">{us.skill?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-blue">{us.level}</span>
                        {us.verification_status === 'verified' && <span className="badge badge-green"><CheckCircle size={10} /> Verified</span>}
                        {us.verification_status === 'rejected' && <span className="badge badge-red">Failed</span>}
                        {us.verification_status === 'pending' && <span className="badge badge-yellow">Pending</span>}
                      </div>
                    </div>
                    {us.verification_status !== 'verified' && (
                      <button onClick={() => setVerifySkill(us)} className="btn-secondary text-xs px-3 py-1.5">
                        <Shield size={12} className="inline mr-1" /> Verify
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Skill Modal */}
      {addingSkill && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md animate-slide-up">
            <div className="p-6 border-b border-surface-border">
              <h2 className="section-title">Add a Skill</h2>
            </div>
            <form onSubmit={addSkill} className="p-6 space-y-4">
              <div className="flex gap-2 rounded-xl bg-surface-hover p-1">
                <button
                  type="button"
                  onClick={() => setSkillInputMode('existing')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm transition-all ${skillInputMode === 'existing' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Choose Existing
                </button>
                <button
                  type="button"
                  onClick={() => setSkillInputMode('custom')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm transition-all ${skillInputMode === 'custom' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Add Custom
                </button>
              </div>
              {skillInputMode === 'existing' ? (
                <div>
                  <label className="label">Select Skill</label>
                  <select
                    value={newSkillForm.skill_id}
                    onChange={e => setNewSkillForm({...newSkillForm, skill_id: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">-- Choose --</option>
                    {skills.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                  </select>
                  {skills.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">No predefined skills yet. Switch to Add Custom.</p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="label">Skill Name</label>
                    <input
                      value={newSkillForm.skill_name}
                      onChange={e => setNewSkillForm({...newSkillForm, skill_name: e.target.value})}
                      className="input"
                      placeholder="e.g. React, DSA, Figma"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <input
                      value={newSkillForm.category}
                      onChange={e => setNewSkillForm({...newSkillForm, category: e.target.value})}
                      className="input"
                      placeholder="e.g. Web Development"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="label">Proficiency Level</label>
                <select value={newSkillForm.level} onChange={e => setNewSkillForm({...newSkillForm, level: e.target.value})} className="input">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="label">Hourly Rate (₹, optional)</label>
                <input type="number" value={newSkillForm.hourly_rate} onChange={e => setNewSkillForm({...newSkillForm, hourly_rate: e.target.value})} className="input" placeholder="e.g. 200" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddingSkill(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Skill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {verifySkill && (
        <VerificationModal
          userSkill={verifySkill}
          onClose={() => setVerifySkill(null)}
          onVerified={() => {
            toast.success('Skill verified!')
            setMySkills(mySkills.map(s => s.id === verifySkill.id ? { ...s, verification_status: 'verified' } : s))
            setVerifySkill(null)
          }}
        />
      )}
    </div>
  )
}

// Missing import fix
function BookOpen({ size, className }) {
  return <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
}
