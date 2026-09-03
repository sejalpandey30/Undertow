import { AlertTriangle, ArrowDownRight, ShieldCheck, Wallet } from 'lucide-react'
import { useBatchStore } from '../store/useBatchStore'
import { money, pct } from '../lib/format'

function Card({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <div className="mt-3 font-display text-2xl font-semibold text-ink-50 num">{value}</div>
      <div className="mt-1 text-xs text-ink-400">{sub}</div>
    </div>
  )
}

export function MetricsCards() {
  const metrics = useBatchStore((s) => s.metrics)

  const atRisk = metrics?.revenueAtRisk ?? 0
  const recovered = metrics?.revenueRecovered ?? 0
  const rate = metrics?.recoveryRate ?? 0
  const escalations = metrics?.escalations ?? 0
  const promised = metrics?.promisedRevenue ?? 0

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card
        icon={<AlertTriangle size={16} />}
        accent="text-signal-leak"
        label="Revenue at risk"
        value={money(atRisk)}
        sub={`${metrics?.totalCases ?? 0} cases in this batch`}
      />
      <Card
        icon={<Wallet size={16} />}
        accent="text-signal-recover"
        label="Recovered"
        value={money(recovered)}
        sub={promised > 0 ? `+${money(promised)} promised` : 'Confirmed payments'}
      />
      <Card
        icon={<ArrowDownRight size={16} />}
        accent="text-amber-400"
        label="Recovery rate"
        value={pct(rate)}
        sub="Recovered ÷ at-risk revenue"
      />
      <Card
        icon={<ShieldCheck size={16} />}
        accent="text-signal-escalate"
        label="Escalated to a human"
        value={String(escalations)}
        sub="Fraud, disputes, or cap reached"
      />
    </div>
  )
}
