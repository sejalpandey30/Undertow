import { useEffect, useRef, useState } from 'react'
import { useBatchStore } from '../store/useBatchStore'
import type { AuditEntry } from '../engine/types'

const STAGE_STYLE: Record<AuditEntry['stage'], { label: string; className: string }> = {
  detect: { label: 'DETECT', className: 'text-ink-300 bg-ink-700/60' },
  diagnose: { label: 'DIAGNOSE', className: 'text-amber-300 bg-amber-500/10' },
  decide: { label: 'DECIDE', className: 'text-signal-escalate bg-signal-escalate/10' },
  execute: { label: 'EXECUTE', className: 'text-ink-200 bg-ink-600/50' },
  stop: { label: 'STOP', className: 'text-signal-leak bg-signal-leak/10' },
  resolve: { label: 'RESOLVE', className: 'text-signal-recover bg-signal-recover/10' },
}

function Row({ entry }: { entry: AuditEntry }) {
  const style = STAGE_STYLE[entry.stage]
  return (
    <div className="animate-rise border-b border-ink-800/70 px-4 py-2.5 last:border-0">
      <div className="flex items-start gap-3">
        <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${style.className}`}>
          {style.label}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-mono text-[11px] text-ink-400">{entry.caseRef}</span>
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-100">{entry.message}</p>
          {entry.detail && <p className="mt-0.5 text-[12px] leading-snug text-ink-400">{entry.detail}</p>}
        </div>
      </div>
    </div>
  )
}

export function AuditLedger() {
  const visible = useBatchStore((s) => s.visibleAudit)
  const status = useBatchStore((s) => s.status)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visible, autoScroll])

  const recent = visible.slice(-400)

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
      <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${status === 'running' ? 'bg-amber-400 animate-pulseDot' : 'bg-ink-500'}`} />
          <h3 className="font-display text-sm font-semibold text-ink-100">Audit ledger</h3>
        </div>
        <span className="font-mono text-[11px] text-ink-500">{visible.length} events</span>
      </div>
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
          setAutoScroll(atBottom)
        }}
        className="flex-1 overflow-y-auto"
      >
        {visible.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-sm text-ink-400">No run yet.</p>
            <p className="text-xs text-ink-500">Every decision the agent makes will stream here, in order, as it happens.</p>
          </div>
        ) : (
          recent.map((e) => <Row key={e.id} entry={e} />)
        )}
      </div>
    </div>
  )
}
