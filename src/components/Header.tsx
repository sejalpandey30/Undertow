import { Waves } from 'lucide-react'
import { useBatchStore } from '../store/useBatchStore'

export function Header() {
  const status = useBatchStore((s) => s.status)
  const run = useBatchStore((s) => s.runBatch)

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
            <Waves size={18} strokeWidth={2.25} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold tracking-tight text-ink-50">Undertow</span>
            <span className="hidden text-xs text-ink-400 sm:inline">revenue recovery agent</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`hidden items-center gap-1.5 text-xs sm:flex ${status === 'running' ? 'text-amber-400' : 'text-ink-400'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === 'running' ? 'bg-amber-400 animate-pulseDot' : status === 'done' ? 'bg-signal-recover' : 'bg-ink-500'}`} />
            {status === 'idle' && 'Awaiting run'}
            {status === 'running' && 'Agent running'}
            {status === 'done' && 'Batch complete'}
          </span>
          <button
            onClick={run}
            disabled={status === 'running'}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-ink-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'idle' ? 'Run recovery batch' : status === 'running' ? 'Running…' : 'Run again'}
          </button>
        </div>
      </div>
    </header>
  )
}
