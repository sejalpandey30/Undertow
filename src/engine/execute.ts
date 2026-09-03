import type { ActionType, CaseStatus, RevenueCase } from './types'

export interface ExecutionResult {
  status: CaseStatus
  recoveredAmount?: number
  promiseDate?: string
  outcomeNote: string
}

// Outcome likelihoods are informed by the case's riskScore (from the
// generator) plus a bonus for actions that are well-matched to the
// diagnosed cause. This is a simulation standing in for real channel
// send/response data — in production this function is replaced by
// webhook-driven outcomes from the payment processor / messaging provider.
const ACTION_BASE_SUCCESS: Partial<Record<ActionType, number>> = {
  smart_retry: 0.55,
  card_update_link: 0.5,
  checkout_nudge: 0.38,
  discount_nudge: 0.3,
  dunning_sequence: 0.42,
  reminder_email: 0.35,
  mandate_retry_sequence: 0.47,
}

export function execute(c: RevenueCase, action: ActionType, rng: () => number): ExecutionResult {
  if (action === 'suppressed_opt_out') {
    return { status: 'suppressed', outcomeNote: 'No contact made; case remains open for non-messaging recovery.' }
  }
  if (action === 'suppressed_quiet_hours') {
    return { status: 'queued', outcomeNote: 'Requeued for the next allowed contact window.' }
  }
  if (action === 'human_review') {
    return { status: 'escalated', outcomeNote: 'Sitting in the human review queue — no further automated action.' }
  }
  if (action === 'collections_escalation') {
    return { status: 'escalated', outcomeNote: 'Handed to the accounts team for direct follow-up.' }
  }

  const base = ACTION_BASE_SUCCESS[action] ?? 0.35
  const p = Math.min(0.93, base * (0.5 + c.riskScore))
  const roll = rng()

  if (roll < p) {
    return {
      status: 'recovered',
      recoveredAmount: c.amount,
      outcomeNote: 'Customer completed payment following outreach.',
    }
  }

  // Overdue receivables get a middle outcome: a promise to pay.
  if (c.type === 'overdue_receivable' && roll < p + 0.28) {
    const days = 3 + Math.floor(rng() * 10)
    const date = new Date(Date.now() + days * 24 * 3600_000)
    return {
      status: 'promised',
      promiseDate: date.toISOString().slice(0, 10),
      outcomeNote: `Customer committed to paying by ${date.toISOString().slice(0, 10)}.`,
    }
  }

  return { status: 'in_progress', outcomeNote: 'No response yet — eligible for the next touch if under the cap.' }
}
