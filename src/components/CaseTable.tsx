import { useBatchStore } from '../store/useBatchStore'
import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL, money } from '../lib/format'

const TYPE_FILTERS = ['payment_failure', 'checkout_abandonment', 'subscription_dunning', 'overdue_receivable']

export function CaseTable() {
  const cases = useBatchStore((s) => s.cases)
  const filterType = useBatchStore((s) => s.filterType)
  const setFilterType = useBatchStore((s) => s.setFilterType)
  const selectCase = useBatchStore((s) => s.selectCase)
  const status = useBatchStore((s) => s.status)

  const filtered = filterType ? cases.filter((c) => c.type === filterType) : cases

  if (status === 'idle') {
    return (
      <div className="rounded-xl border border-ink-700 bg-ink-900 p-10 text-center">
        <p className="text-sm text-ink-400">Run a batch to see individual cases here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-700 px-4 py-3">
        <button
          onClick={() => setFilterType(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${!filterType ? 'bg-amber-500 text-ink-950' : 'bg-ink-800 text-ink-300 hover:text-ink-100'}`}
        >
          All ({cases.length})
        </button>
        {TYPE_FILTERS.map((t) => {
          const count = cases.filter((c) => c.type === t).length
          if (!count) return null
          return (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${filterType === t ? 'bg-amber-500 text-ink-950' : 'bg-ink-800 text-ink-300 hover:text-ink-100'}`}
            >
              {TYPE_LABEL[t]} ({count})
            </button>
          )
        })}
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-ink-900 text-xs uppercase tracking-wide text-ink-500">
            <tr className="border-b border-ink-700">
              <th className="px-4 py-2.5 font-medium">Case</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Amount</th>
              <th className="px-4 py-2.5 font-medium">Root cause</th>
              <th className="px-4 py-2.5 font-medium">Touches</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => selectCase(c.id)}
                className="cursor-pointer border-b border-ink-800 transition hover:bg-ink-800/60"
              >
                <td className="px-4 py-2.5 font-mono text-xs text-ink-300">{c.id}</td>
                <td className="px-4 py-2.5 text-ink-200">{c.customer.name}</td>
                <td className="px-4 py-2.5 num text-ink-200">{c.currency === 'INR' ? '₹' : '$'}{c.amount.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-xs text-ink-400">{c.rootCause?.replace(/_/g, ' ') ?? '—'}</td>
                <td className="px-4 py-2.5 num text-ink-300">{c.touches}</td>
                <td className={`px-4 py-2.5 text-xs font-medium ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
