import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { MetricsCards } from './components/MetricsCards'
import { LeakBreakdown } from './components/LeakBreakdown'
import { AuditLedger } from './components/AuditLedger'
import { CaseTable } from './components/CaseTable'
import { CaseDrawer } from './components/CaseDrawer'
import { ComplianceRules } from './components/ComplianceRules'
import { useBatchStore } from './store/useBatchStore'

export default function App() {
  const status = useBatchStore((s) => s.status)

  return (
    <div className="min-h-screen bg-grain">
      <Header />
      <Hero />

      {status !== 'idle' && (
        <main className="mx-auto max-w-7xl space-y-6 px-6 pb-24">
          <MetricsCards />

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <LeakBreakdown />
            <div className="h-[420px]">
              <AuditLedger />
            </div>
          </div>

          <ComplianceRules />

          <div>
            <h2 className="mb-3 font-display text-sm font-semibold text-ink-100">Cases</h2>
            <CaseTable />
          </div>
        </main>
      )}

      <footer className="border-t border-ink-800 py-8">
        <div className="mx-auto max-w-7xl px-6 text-xs text-ink-500">
          Undertow is a demonstration prototype. All customers, invoices, and messages are synthetic — no
          communications are actually sent and no payments are actually processed.
        </div>
      </footer>

      <CaseDrawer />
    </div>
  )
}
