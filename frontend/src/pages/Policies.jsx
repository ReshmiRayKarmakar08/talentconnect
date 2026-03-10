import { Link } from 'react-router-dom'
import BrandMark from '../components/branding/BrandMark'

const policies = [
  {
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect personal data.',
    to: '/privacy',
  },
  {
    title: 'Refund Policy',
    description: 'Eligibility and process for payment refunds.',
    to: '/refund-policy',
  },
  {
    title: 'Return Policy',
    description: 'Returns and cancellations for digital services.',
    to: '/return-policy',
  },
  {
    title: 'Disclaimer',
    description: 'Important terms about platform use and limitations.',
    to: '/disclaimer',
  },
  {
    title: 'About & Contact',
    description: 'Learn about TalentConnect and how to reach us.',
    to: '/about',
  },
]

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-surface text-gray-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,82,229,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(30,30,79,0.32),transparent_30%),linear-gradient(180deg,#0b1020_0%,#0f1117_45%,#0f1117_100%)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <BrandMark />
          <Link to="/login" className="btn-secondary">
            Login
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 pb-20 pt-12 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_20px_60px_rgba(6,10,24,0.45)]">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-300">Policies</p>
          <h1 className="mt-3 text-3xl font-bold text-white font-display">TalentConnect Policy Center</h1>
          <p className="mt-3 text-base text-gray-300">
            The following pages describe how the platform handles privacy, refunds, returns, and important disclosures.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {policies.map((policy) => (
            <Link
              key={policy.title}
              to={policy.to}
              className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_35px_rgba(7,10,18,0.25)] transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-500/40 hover:bg-white/[0.06]"
            >
              <h2 className="text-lg font-semibold text-white">{policy.title}</h2>
              <p className="mt-3 text-sm leading-7 text-gray-400">{policy.description}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-brand-300 transition-colors group-hover:text-white">
                View policy
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
