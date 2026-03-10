import { Link } from 'react-router-dom'
import BrandMark from '../components/branding/BrandMark'

function LegalShell({ title, subtitle, lastUpdated = 'March 10, 2026', children }) {
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

      <main className="relative mx-auto max-w-4xl px-6 pb-20 pt-12 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_20px_60px_rgba(6,10,24,0.45)]">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-300">TalentConnect Policies</p>
          <h1 className="mt-3 text-3xl font-bold text-white font-display">{title}</h1>
          {subtitle ? <p className="mt-3 text-base text-gray-300">{subtitle}</p> : null}
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-500">Last updated: {lastUpdated}</p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-gray-300">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export function PrivacyPolicyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle="This policy explains what data we collect, how it is used, and the choices you have."
    >
      <p>
        TalentConnect collects account information such as your name, email, username, and institution to create your profile
        and enable platform features. We also store activity data like skills added, sessions booked, tasks posted, and wallet
        transactions so the platform can function properly.
      </p>
      <p>
        We use this information to provide services, personalize recommendations, maintain security, and improve product quality.
        We do not sell your personal data. We only share data with service providers when necessary to operate the platform,
        or when required by law.
      </p>
      <p>
        Payment data is handled through our payment partner and we store only the minimum identifiers needed to reconcile
        transactions. We do not store full card details.
      </p>
      <p>
        You can request account deletion or data corrections by contacting us at
        {' '}<a className="text-brand-300 hover:text-white" href="mailto:raykarmakar8@gmail.com">raykarmakar8@gmail.com</a>.
        We respond within a reasonable time and may retain limited records for legal or security purposes.
      </p>
      <p>
        By using TalentConnect you consent to this policy. Updates will be published on this page with a revised date.
      </p>
    </LegalShell>
  )
}

export function RefundPolicyPage() {
  return (
    <LegalShell
      title="Refund Policy"
      subtitle="Refunds apply to eligible payments made through TalentConnect."
    >
      <p>
        TalentConnect offers digital services such as learning sessions and task collaboration. Refunds may be issued for
        duplicate payments, payment failures with successful charges, or service cancellations that occur before a mentor
        accepts a session or a task is started.
      </p>
      <p>
        Refund requests must be submitted within 7 days of the transaction date. Approved refunds are processed back to the
        original payment method, subject to payment partner timelines.
      </p>
      <p>
        If a session was completed or a task was marked as delivered, the payment is considered final unless there is a verified
        dispute or platform error. We may request additional information to investigate such cases.
      </p>
      <p>
        To request a refund, contact
        {' '}<a className="text-brand-300 hover:text-white" href="mailto:raykarmakar8@gmail.com">raykarmakar8@gmail.com</a>
        {' '}with your registered email, transaction ID, and the reason for the request.
      </p>
    </LegalShell>
  )
}

export function ReturnPolicyPage() {
  return (
    <LegalShell
      title="Return Policy"
      subtitle="Return terms for digital services and platform credits."
    >
      <p>
        TalentConnect provides digital services and platform credits. Physical returns are not applicable. If you purchased
        credits or paid for a service that was not delivered, you can request a refund as described in the Refund Policy.
      </p>
      <p>
        Cancellations are allowed before a mentor accepts a session or a task is in progress. Once a session begins or a task is
        marked in progress, the payment is reserved for the service provider.
      </p>
      <p>
        If you believe a service was not delivered as agreed, contact us within 7 days of completion so we can review the case.
      </p>
    </LegalShell>
  )
}

export function DisclaimerPage() {
  return (
    <LegalShell
      title="Disclaimer"
      subtitle="Important information about use of the TalentConnect platform."
    >
      <p>
        TalentConnect connects students for peer learning, mentoring, and academic collaboration. We do not guarantee outcomes,
        grades, or academic results. All guidance and collaboration are provided by users of the platform.
      </p>
      <p>
        Users are responsible for the accuracy of the content they post and for complying with academic integrity policies of
        their institutions. TalentConnect is not liable for misuse or policy violations.
      </p>
      <p>
        We make reasonable efforts to maintain uptime and service quality, but the platform may be unavailable due to maintenance,
        network issues, or third-party service disruptions.
      </p>
    </LegalShell>
  )
}

export function AboutContactPage() {
  return (
    <LegalShell
      title="About & Contact"
      subtitle="Learn about TalentConnect and how to reach us."
    >
      <p>
        TalentConnect is an intelligent student collaboration and academic support platform. Students can exchange skills,
        book learning sessions, collaborate on academic tasks, and access AI-assisted learning guidance in one workspace.
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold text-white">Contact</p>
        <p className="mt-2 text-sm text-gray-300">Email: <a className="text-brand-300 hover:text-white" href="mailto:raykarmakar8@gmail.com">raykarmakar8@gmail.com</a></p>
        <p className="mt-2 text-sm text-gray-300">Support hours: Monday to Saturday, 10:00 AM – 6:00 PM IST</p>
      </div>
    </LegalShell>
  )
}
