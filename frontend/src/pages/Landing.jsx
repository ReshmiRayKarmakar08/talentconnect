import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarClock,
  ChevronRight,
  Layers3,
  ShieldCheck,
  Users,
} from 'lucide-react'
import BrandMark from '../components/branding/BrandMark'

const highlights = [
  {
    icon: Layers3,
    title: 'Skill Exchange',
    description: 'Students can teach skills they know and learn from others.',
  },
  {
    icon: CalendarClock,
    title: 'Learning Sessions',
    description: 'Book structured sessions with peer mentors.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Task Marketplace',
    description: 'Post academic tasks or help others complete them.',
  },
  {
    icon: BrainCircuit,
    title: 'AI Learning Assistant',
    description: 'Receive learning guidance, skill recommendations, and study roadmaps.',
  },
]

function NavButton({ to, children, primary = false }) {
  return (
    <Link
      to={to}
      className={
        primary
          ? 'btn-primary inline-flex items-center justify-center'
          : 'btn-secondary inline-flex items-center justify-center'
      }
    >
      {children}
    </Link>
  )
}

function PreviewCard({ title, value, subtitle, badge }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(5,8,18,0.35)] backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-200">{title}</p>
        {badge ? (
          <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[11px] font-medium text-brand-300">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="text-2xl font-semibold text-white font-display">{value}</p>
      <p className="mt-2 text-xs text-gray-400">{subtitle}</p>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-gray-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,82,229,0.22),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(30,30,79,0.36),transparent_30%),linear-gradient(180deg,#0b1020_0%,#0f1117_45%,#0f1117_100%)]" />
        <div className="absolute left-1/2 top-32 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-600/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-3">
            <NavButton to="/login">Login</NavButton>
            <NavButton to="/login" primary>Get Started</NavButton>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto grid max-w-7xl gap-16 px-6 pb-16 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-24">
          <div className="animate-slide-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
              <ShieldCheck size={14} className="text-brand-300" />
              Peer learning, verified skills, guided growth
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight text-white font-display md:text-6xl">
              Learn Together. Build Skills. Grow Faster.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              TalentConnect is a collaborative academic platform where students connect with peers to exchange
              knowledge, book mentoring sessions, solve academic tasks, and receive intelligent learning guidance.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/login" className="btn-primary inline-flex items-center justify-center gap-2">
                Start Learning <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn-secondary inline-flex items-center justify-center gap-2">
                Create Account <ChevronRight size={16} />
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 text-sm text-gray-400">
              <div>
                <p className="text-2xl font-semibold text-white font-display">4</p>
                <p className="mt-1">core learning workflows</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white font-display">1</p>
                <p className="mt-1">student-first platform</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white font-display">24/7</p>
                <p className="mt-1">AI-powered guidance</p>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute -left-8 top-8 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="absolute bottom-12 right-0 h-48 w-48 rounded-full bg-brand-900/40 blur-3xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#111726]/85 p-5 shadow-[0_24px_80px_rgba(6,10,24,0.6)] backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-medium text-gray-200">Student workspace</p>
                  <p className="mt-1 text-xs text-gray-500">Everything unlocked after login</p>
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Live dashboard
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <PreviewCard
                  title="Skill Exchange"
                  value="12 mentors"
                  subtitle="Peer-led help for DSA, React, Python, and more."
                  badge="Matched"
                />
                <PreviewCard
                  title="Task Marketplace"
                  value="8 open tasks"
                  subtitle="Structured academic requests with clear budgets and deadlines."
                  badge="Active"
                />
                <PreviewCard
                  title="Learning Sessions"
                  value="3 upcoming"
                  subtitle="Book time with students who can teach specific concepts."
                  badge="Scheduled"
                />
                <PreviewCard
                  title="AI Assistant"
                  value="Study roadmap"
                  subtitle="Get direction when you are stuck or planning your next skill."
                  badge="Adaptive"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1120] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-200">Collaboration flow</p>
                  <p className="text-xs text-gray-500">Inside the dashboard</p>
                </div>
                <div className="grid gap-3 text-sm text-gray-300 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    Discover mentors
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    Book sessions
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    Track progress
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-300">Platform Highlights</p>
            <h2 className="mt-3 text-3xl font-bold text-white font-display">Why TalentConnect</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_35px_rgba(7,10,18,0.25)] transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-500/40 hover:bg-white/[0.06]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-300 transition-transform duration-300 group-hover:scale-105">
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-400">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-brand-950 via-[#131a30] to-surface-card p-8 shadow-[0_24px_70px_rgba(6,10,24,0.45)]">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                  <Users size={14} className="text-brand-300" />
                  Built for peer collaboration
                </div>
                <h2 className="text-3xl font-bold text-white font-display">Built for Student Collaboration</h2>
                <p className="mt-5 text-base leading-8 text-gray-300">
                  TalentConnect helps students collaborate with peers, exchange practical skills, build reputation
                  through verified expertise, and support each other academically in one focused workspace.
                </p>
              </div>
              <div className="mt-8 grid gap-3 text-sm text-gray-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Collaborate with peers on real learning goals</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Exchange skills and validate progress over time</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Build trust through visible contribution and reputation</div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#101626] p-8">
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
            <div className="relative grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-gray-400">Verified growth</p>
                <p className="mt-3 text-3xl font-semibold text-white font-display">Skills + trust</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-gray-400">Shared momentum</p>
                <p className="mt-3 text-3xl font-semibold text-white font-display">Peer support</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-gray-400">Academic help</p>
                <p className="mt-3 text-3xl font-semibold text-white font-display">Task exchange</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-gray-400">Smarter learning</p>
                <p className="mt-3 text-3xl font-semibold text-white font-display">AI guidance</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-brand-400/20 bg-[linear-gradient(135deg,rgba(50,52,130,0.9),rgba(16,22,38,0.92))] px-8 py-12 text-center shadow-[0_24px_80px_rgba(21,26,56,0.45)]">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-200">Get Started</p>
            <h2 className="mt-4 text-4xl font-bold text-white font-display">Start Your Learning Journey</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-brand-50/85">
              Join TalentConnect and collaborate with students who want to learn, teach, and grow together.
            </p>
            <Link to="/login" className="btn-primary mt-8 inline-flex items-center justify-center gap-2 bg-white text-surface hover:bg-brand-50">
              Login to Continue <ArrowRight size={16} />
            </Link>
            <p className="mt-4 text-sm text-brand-100/75">
              After login users will be redirected to the dashboard where all platform features are available.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-8">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_20px_60px_rgba(6,10,24,0.35)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-300">Policies</p>
                <h2 className="mt-3 text-2xl font-bold text-white font-display">Policy Center</h2>
                <p className="mt-3 text-sm text-gray-400">
                  Review our privacy, refund, return, and platform disclosure policies.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link to="/privacy" className="btn-secondary px-4 py-2">Privacy</Link>
                <Link to="/refund-policy" className="btn-secondary px-4 py-2">Refund</Link>
                <Link to="/return-policy" className="btn-secondary px-4 py-2">Return</Link>
                <Link to="/disclaimer" className="btn-secondary px-4 py-2">Disclaimer</Link>
                <Link to="/about" className="btn-secondary px-4 py-2">About & Contact</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/10 bg-[linear-gradient(180deg,#0c1120_0%,#0a0f1b_100%)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div className="max-w-md">
              <BrandMark />
              <p className="mt-5 text-sm leading-7 text-gray-400">
                TalentConnect brings peer learning, mentoring, academic collaboration, and intelligent guidance into one focused student platform.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs text-gray-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Peer learning</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Skill exchange</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">AI guidance</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Platform</h3>
              <div className="mt-5 flex flex-col gap-3 text-sm text-gray-400">
                <Link to="/login" className="transition-colors hover:text-white">Login</Link>
                <Link to="/login" className="transition-colors hover:text-white">Get Started</Link>
                <a href="https://talentconnect-backend-qu3k.onrender.com/api/docs" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">API Docs</a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Policies</h3>
              <div className="mt-5 flex flex-col gap-3 text-sm text-gray-400">
                <Link to="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
                <Link to="/refund-policy" className="transition-colors hover:text-white">Refund Policy</Link>
                <Link to="/return-policy" className="transition-colors hover:text-white">Return Policy</Link>
                <Link to="/disclaimer" className="transition-colors hover:text-white">Disclaimer</Link>
                <Link to="/about" className="transition-colors hover:text-white">About & Contact</Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Access</h3>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-gray-300">All collaborative tools open after authentication.</p>
                <Link to="/login" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-300 transition-colors hover:text-white">
                  Continue to login <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-gray-500 lg:flex-row lg:items-center lg:justify-between">
            <p>© 2026 TalentConnect. All rights reserved.</p>
            <p>Designed for collaborative student growth, mentoring, and guided academic support.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
