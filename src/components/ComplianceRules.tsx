import { Ban, Clock, Gavel, Repeat } from 'lucide-react'
import { useBatchStore } from '../store/useBatchStore'

const RULES = [
  { icon: Repeat, title: '3-touch cap', detail: 'No case is contacted more than three times. On the third miss it hands off to a human instead of retrying again.' },
  { icon: Clock, title: 'Quiet hours', detail: 'Nothing is sent between 9pm and 8am local time — the first attempt is held for the next window.' },
  { icon: Ban, title: 'Opt-out honored', detail: 'Do-not-contact customers are never messaged; their cases wait for manual or non-messaging recovery only.' },
  { icon: Gavel, title: 'Escalation, not persistence', detail: 'Suspected fraud and disputed invoices route straight to a human — no automated outreach on ambiguous or sensitive cases.' },
  { icon: Repeat, title: 'Mandate retries stay bounded', detail: 'Lapsed UPI Autopay mandates get their own re-authorization flow instead of a plain card retry, and never exceed the retry window a customer would reasonably expect.' },
]

export function ComplianceRules() {
  const metrics = useBatchStore((s) => s.metrics)
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink-100">Stopping rules</h3>
        {metrics && <span className="font-mono text-[11px] text-ink-500">{metrics.suppressed} suppressed this run</span>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {RULES.map((r) => (
          <div key={r.title} className="flex gap-3">
            <r.icon size={16} className="mt-0.5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-ink-100">{r.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{r.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
