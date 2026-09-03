export function money(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1000) {
    return `$${(n / 1000).toFixed(1)}k`
  }
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export const TYPE_LABEL: Record<string, string> = {
  payment_failure: 'Payment failure',
  checkout_abandonment: 'Checkout abandonment',
  subscription_dunning: 'Subscription dunning',
  overdue_receivable: 'Overdue receivable',
}

export const STATUS_LABEL: Record<string, string> = {
  queued: 'Queued',
  diagnosing: 'Diagnosing',
  in_progress: 'In progress',
  recovered: 'Recovered',
  promised: 'Promised',
  escalated: 'Escalated',
  suppressed: 'Suppressed',
  lost: 'Lost',
}

export const STATUS_COLOR: Record<string, string> = {
  recovered: 'text-signal-recover',
  promised: 'text-amber-400',
  in_progress: 'text-ink-300',
  queued: 'text-ink-300',
  escalated: 'text-signal-escalate',
  suppressed: 'text-ink-400',
  lost: 'text-signal-leak',
}
