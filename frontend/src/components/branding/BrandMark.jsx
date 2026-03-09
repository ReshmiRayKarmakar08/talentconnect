import clsx from 'clsx'

export default function BrandMark({ compact = false, className = '', textClassName = '' }) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 bg-[linear-gradient(145deg,#1f2850,#11182d)] shadow-[0_12px_30px_rgba(8,12,24,0.45)]">
        <div className="grid h-5 w-5 grid-cols-2 grid-rows-2 gap-1">
          <span className="rounded-[4px] bg-white/95" />
          <span className="rounded-[4px] bg-brand-400" />
          <span className="rounded-[4px] bg-brand-500" />
          <span className="rounded-[4px] bg-white/25" />
        </div>
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-brand-200/40 bg-brand-400/90 shadow-[0_0_18px_rgba(129,145,248,0.6)]" />
      </div>
      {!compact ? (
        <span className={clsx('text-xl font-semibold tracking-tight text-white font-display', textClassName)}>
          Talent<span className="text-brand-400">Connect</span>
        </span>
      ) : null}
    </div>
  )
}
