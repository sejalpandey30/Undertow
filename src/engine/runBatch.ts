import type { AuditEntry, BatchMetrics, LeakType, RevenueCase } from './types'
import { diagnose } from './diagnose'
import { decide } from './decide'
import { execute } from './execute'
import { composeMessage } from './messages'
import { makeRng } from './rng'

const TYPE_LABEL: Record<LeakType, string> = {
  payment_failure: 'Payment failure',
  checkout_abandonment: 'Checkout abandonment',
  subscription_dunning: 'Subscription dunning',
  overdue_receivable: 'Overdue receivable',
}

const OUTREACH_ACTIONS = new Set([
  'smart_retry', 'card_update_link', 'checkout_nudge', 'discount_nudge',
  'dunning_sequence', 'reminder_email', 'promise_to_pay', 'mandate_retry_sequence',
])

const MAX_LOOPS_PER_CASE = 5

export interface BatchResult {
  cases: RevenueCase[]
  audit: AuditEntry[]
  metrics: BatchMetrics
}

let auditCounter = 0
function auditId() {
  auditCounter += 1
  return `EV-${auditCounter}`
}

function caseRef(c: RevenueCase) {
  return c.customer.company ? `${c.id} · ${c.customer.company}` : `${c.id} · ${c.customer.name}`
}

export function runBatch(inputCases: RevenueCase[], seed: number): BatchResult {
  const rng = makeRng(seed ^ 0x9e3779b9)
  const audit: AuditEntry[] = []
  const cases: RevenueCase[] = inputCases.map((c) => ({ ...c, actionsTaken: [...c.actionsTaken] }))

  for (const c of cases) {
    audit.push({
      id: auditId(),
      ts: Date.now(),
      caseId: c.id,
      caseRef: caseRef(c),
      stage: 'detect',
      message: `${TYPE_LABEL[c.type]} detected — ${c.currency} ${c.amount.toFixed(2)} at risk.`,
    })

    let deferred = false
    let loops = 0

    while (loops < MAX_LOOPS_PER_CASE) {
      loops += 1
      const d = diagnose(c)
      c.rootCause = d.cause
      c.rootCauseConfidence = d.confidence
      audit.push({
        id: auditId(),
        ts: Date.now(),
        caseId: c.id,
        caseRef: caseRef(c),
        stage: 'diagnose',
        message: `Root cause: ${d.cause.replace(/_/g, ' ')} (${Math.round(d.confidence * 100)}% confidence).`,
        detail: d.reasoning,
      })

      const decision = decide(c, d.cause, deferred)
      audit.push({
        id: auditId(),
        ts: Date.now(),
        caseId: c.id,
        caseRef: caseRef(c),
        stage: 'decide',
        message: `Action chosen: ${decision.action.replace(/_/g, ' ')}.`,
        detail: decision.reasoning,
      })

      if (decision.action === 'suppressed_quiet_hours') {
        deferred = true
        audit.push({
          id: auditId(),
          ts: Date.now(),
          caseId: c.id,
          caseRef: caseRef(c),
          stage: 'stop',
          message: 'Held for quiet hours — no message sent.',
        })
        continue
      }

      c.actionsTaken.push(decision.action)
      if (OUTREACH_ACTIONS.has(decision.action)) c.touches += 1

      const msg = composeMessage(c, decision.action)
      audit.push({
        id: auditId(),
        ts: Date.now(),
        caseId: c.id,
        caseRef: caseRef(c),
        stage: 'execute',
        message: `Sent via ${msg.channel}.`,
        detail: msg.body,
      })

      const result = execute(c, decision.action, rng)
      c.status = result.status
      if (result.recoveredAmount) c.recoveredAmount = result.recoveredAmount
      if (result.promiseDate) c.promiseDate = result.promiseDate

      const terminal = ['recovered', 'promised', 'escalated', 'suppressed'].includes(result.status)
      audit.push({
        id: auditId(),
        ts: Date.now(),
        caseId: c.id,
        caseRef: caseRef(c),
        stage: terminal ? 'resolve' : 'execute',
        message: result.outcomeNote,
      })

      if (terminal) break
      // status is 'in_progress' or requeued -> loop again unless out of attempts
      if (c.touches >= 3 && c.status !== 'escalated') {
        // next loop iteration's decide() call will catch the touch cap
        continue
      }
    }

    if (cases_still_open(c)) {
      c.status = c.status === 'queued' ? 'in_progress' : c.status
    }
  }

  return { cases, audit, metrics: computeMetrics(cases) }
}

function cases_still_open(c: RevenueCase) {
  return !['recovered', 'promised', 'escalated', 'suppressed', 'lost'].includes(c.status)
}

export function computeMetrics(cases: RevenueCase[]): BatchMetrics {
  const byType: BatchMetrics['byType'] = {
    payment_failure: { count: 0, recovered: 0, atRisk: 0 },
    checkout_abandonment: { count: 0, recovered: 0, atRisk: 0 },
    subscription_dunning: { count: 0, recovered: 0, atRisk: 0 },
    overdue_receivable: { count: 0, recovered: 0, atRisk: 0 },
  }
  const byAction: BatchMetrics['byAction'] = {}

  let revenueAtRisk = 0
  let revenueRecovered = 0
  let promisedRevenue = 0
  let escalations = 0
  let suppressed = 0
  let touchesSum = 0

  for (const c of cases) {
    revenueAtRisk += c.amount
    byType[c.type].count += 1
    byType[c.type].atRisk += c.amount
    touchesSum += c.touches
    for (const a of c.actionsTaken) byAction[a] = (byAction[a] ?? 0) + 1

    if (c.status === 'recovered') {
      revenueRecovered += c.recoveredAmount ?? c.amount
      byType[c.type].recovered += c.recoveredAmount ?? c.amount
    }
    if (c.status === 'promised') promisedRevenue += c.amount
    if (c.status === 'escalated') escalations += 1
    if (c.status === 'suppressed') suppressed += 1
  }

  return {
    totalCases: cases.length,
    revenueAtRisk,
    revenueRecovered,
    promisedRevenue,
    recoveryRate: revenueAtRisk > 0 ? revenueRecovered / revenueAtRisk : 0,
    escalations,
    suppressed,
    avgTouches: cases.length > 0 ? touchesSum / cases.length : 0,
    byType,
    byAction,
  }
}
