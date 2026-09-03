import { ArrowRight } from 'lucide-react'
import { useBatchStore } from '../store/useBatchStore'

const LEAKS = [
  { label: 'Payment failure', detail: 'card declines, expired instruments, soft holds' },
  { label: 'Checkout abandonment', detail: 'OTP drop, shipping shock, last-step hesitation' },
  { label: 'Subscription dunning', detail: 'failed renewals, stale cards on file' },
  { label: 'Overdue receivable', detail: 'forgotten invoices, disputes, cashflow delay' },
]

export function Hero() {
  const run = useBatchStore((s) => s.runBatch)
  const status = useBatchStore((s) => s.status)

  return (
    <section className="mx-auto max-w-7xl px-6 pb-14 pt-16 sm:pt-24">
      <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-amber-400/90">
            Detect → diagnose → decide → recover
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink-50 sm:text-5xl lg:text-6xl">
            Revenue doesn't vanish.
            <br />
            It goes under the surface.
          </h1>
          <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-ink-300 sm:text-lg">
            Undertow watches every payment failure, checkout drop-off, dunning cycle, and
            overdue invoice — works out why it happened — and runs a bounded, compliant
            recovery workflow to pull it back, with a full audit trail for every decision.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={run}
              disabled={status === 'running'}
              className="group inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-medium text-ink-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Run a live batch of 42 cases
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </button>
            <span className="text-xs text-ink-400">Synthetic data, deterministic per seed — nothing is actually sent.</span>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-ink-700 bg-ink-700 sm:grid-cols-2">
          {LEAKS.map((leak) => (
            <div key={leak.label} className="bg-ink-900 p-5">
              <dt className="font-display text-sm font-semibold text-ink-100">{leak.label}</dt>
              <dd className="mt-1.5 text-xs leading-relaxed text-ink-400">{leak.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
