import { X } from 'lucide-react'
import { useBatchStore } from '../store/useBatchStore'
import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from '../lib/format'

export function CaseDrawer() {
  const selectedId = useBatchStore((s) => s.selectedCaseId)
  const cases = useBatchStore((s) => s.cases)
  const fullAudit = useBatchStore((s) => s.fullAudit)
  const selectCase = useBatchStore((s) => s.selectCase)

  if (!selectedId) return null
  const c = cases.find((x) => x.id === selectedId)
  if (!c) return null
  const trail = fullAudit.filter((e) => e.caseId === c.id)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => selectCase(null)} />
      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-ink-700 bg-ink-900 shadow-2xl animate-rise">
        <div className="flex items-start justify-between border-b border-ink-700 px-6 py-5">
          <div>
            <p className="font-mono text-xs text-ink-500">{c.id}</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-ink-50">{c.customer.name}</h2>
            {c.customer.company && <p className="text-xs text-ink-400">{c.customer.company}</p>}
          </div>
          <button onClick={() => selectCase(null)} className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-800 hover:text-ink-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-ink-500">Type</p>
              <p className="mt-0.5 text-ink-100">{TYPE_LABEL[c.type]}</p>
            </div>
            <div>
              <p className="text-xs text-ink-500">Amount</p>
              <p className="mt-0.5 num text-ink-100">{c.currency === 'INR' ? '₹' : '$'}{c.amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-500">Status</p>
              <p className={`mt-0.5 font-medium ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</p>
            </div>
            <div>
              <p className="text-xs text-ink-500">Touches</p>
              <p className="mt-0.5 num text-ink-100">{c.touches} of 3 max</p>
            </div>
            {c.rootCause && (
              <div className="col-span-2">
                <p className="text-xs text-ink-500">Diagnosed root cause</p>
                <p className="mt-0.5 text-ink-100">{c.rootCause.replace(/_/g, ' ')} · {Math.round((c.rootCauseConfidence ?? 0) * 100)}% confidence</p>
              </div>
            )}
            {c.promiseDate && (
              <div className="col-span-2">
                <p className="text-xs text-ink-500">Promise to pay</p>
                <p className="mt-0.5 text-amber-300">Committed for {c.promiseDate}</p>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-ink-800 pt-5">
            <h3 className="mb-3 font-display text-sm font-semibold text-ink-100">Case audit trail</h3>
            <div className="space-y-0">
              {trail.map((e) => (
                <div key={e.id} className="border-l-2 border-ink-700 py-2 pl-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-amber-400">{e.stage}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-100">{e.message}</p>
                  {e.detail && <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{e.detail}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
