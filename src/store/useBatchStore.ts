import { create } from 'zustand'
import type { AuditEntry, BatchMetrics, RevenueCase } from '../engine/types'
import { generateBatch } from '../data/generator'
import { runBatch, computeMetrics } from '../engine/runBatch'

interface BatchState {
  seed: number
  cases: RevenueCase[]
  fullAudit: AuditEntry[]
  visibleAudit: AuditEntry[]
  metrics: BatchMetrics | null
  status: 'idle' | 'running' | 'done'
  selectedCaseId: string | null
  filterType: string | null
  runBatch: () => void
  reset: () => void
  selectCase: (id: string | null) => void
  setFilterType: (t: string | null) => void
}

let streamTimer: ReturnType<typeof setInterval> | null = null

export const useBatchStore = create<BatchState>((set, get) => ({
  seed: Math.floor(Math.random() * 1_000_000),
  cases: [],
  fullAudit: [],
  visibleAudit: [],
  metrics: null,
  status: 'idle',
  selectedCaseId: null,
  filterType: null,

  runBatch: () => {
    if (streamTimer) clearInterval(streamTimer)
    const seed = Math.floor(Math.random() * 1_000_000)
    const initial = generateBatch(seed, 42)
    const { cases, audit } = runBatch(initial, seed)

    set({
      seed,
      cases,
      fullAudit: audit,
      visibleAudit: [],
      metrics: null,
      status: 'running',
      selectedCaseId: null,
    })

    let i = 0
    const chunk = Math.max(1, Math.floor(audit.length / 90))
    streamTimer = setInterval(() => {
      i += chunk
      const slice = audit.slice(0, i)
      const isDone = i >= audit.length
      set({
        visibleAudit: slice,
        status: isDone ? 'done' : 'running',
        metrics: isDone ? computeMetrics(cases) : partialMetrics(cases, slice),
      })
      if (isDone && streamTimer) {
        clearInterval(streamTimer)
        streamTimer = null
      }
    }, 45)
  },

  reset: () => {
    if (streamTimer) clearInterval(streamTimer)
    set({ cases: [], fullAudit: [], visibleAudit: [], metrics: null, status: 'idle', selectedCaseId: null })
  },

  selectCase: (id) => set({ selectedCaseId: id }),
  setFilterType: (t) => set({ filterType: t }),
}))

// While the ledger is still streaming, approximate live metrics from
// however many cases have reached a terminal state so far, so the
// dashboard numbers climb in step with the ledger instead of jumping
// to the final total at the end.
function partialMetrics(allCases: RevenueCase[], visible: AuditEntry[]): BatchMetrics {
  const seenIds = new Set(visible.map((e) => e.caseId))
  const resolvedIds = new Set(
    visible.filter((e) => e.stage === 'resolve').map((e) => e.caseId)
  )
  const relevant = allCases.filter((c) => seenIds.has(c.id))
  const snapshot = relevant.map((c) => (resolvedIds.has(c.id) ? c : { ...c, status: 'in_progress' as const, recoveredAmount: undefined }))
  return computeMetrics(snapshot)
}
