import type { ActionType, RevenueCase, RootCause } from './types'

const CAUSE_TO_ACTION: Record<RootCause, ActionType> = {
  insufficient_funds: 'smart_retry',
  expired_card: 'card_update_link',
  issuer_soft_decline: 'smart_retry',
  processor_glitch: 'smart_retry',
  suspected_fraud: 'human_review',
  otp_drop: 'checkout_nudge',
  price_hesitation: 'discount_nudge',
  shipping_cost_shock: 'discount_nudge',
  payment_field_friction: 'checkout_nudge',
  card_on_file_stale: 'dunning_sequence',
  mandate_lapsed: 'mandate_retry_sequence',
  invoice_disputed: 'human_review',
  invoice_forgotten: 'reminder_email',
  cashflow_delay: 'reminder_email',
}

export interface Decision {
  action: ActionType
  reasoning: string
}

// Stopping rules are checked before the cause->action map ever runs.
// Compliance and rate limits always win over what would otherwise be
// the "best" recovery action.
export function decide(c: RevenueCase, cause: RootCause, alreadyDeferred = false): Decision {
  if (c.customer.doNotContact) {
    return { action: 'suppressed_opt_out', reasoning: 'Customer is on the do-not-contact list — no automated outreach permitted.' }
  }

  const hour = new Date(c.createdAt).getHours()
  const inQuietHours = hour >= 21 || hour < 8
  if (inQuietHours && c.touches === 0 && !alreadyDeferred) {
    return { action: 'suppressed_quiet_hours', reasoning: 'Detected inside quiet hours (9pm–8am local) — outreach deferred to next window.' }
  }

  const MAX_TOUCHES = 3
  if (c.touches >= MAX_TOUCHES) {
    if (c.type === 'overdue_receivable') {
      return { action: 'collections_escalation', reasoning: `Reached the ${MAX_TOUCHES}-touch cap with no response — escalating to a human for a direct conversation rather than continuing automated contact.` }
    }
    return { action: 'human_review', reasoning: `Reached the ${MAX_TOUCHES}-touch cap with no resolution — handing off instead of contacting again.` }
  }

  if (cause === 'invoice_disputed' && c.touches > 0) {
    return { action: 'collections_escalation', reasoning: 'A disputed invoice that survives a first reminder needs a person, not another automated message.' }
  }

  const action = CAUSE_TO_ACTION[cause]
  return { action, reasoning: describeMapping(cause, action) }
}

function describeMapping(cause: RootCause, action: ActionType): string {
  const map: Record<string, string> = {
    smart_retry: 'Likely to resolve on its own — a timed retry avoids bothering the customer at all.',
    card_update_link: 'The instrument itself is the problem, so the fastest path is a direct update link.',
    checkout_nudge: 'Intent was high right up to the drop point — a light nudge back to the same cart works best.',
    discount_nudge: 'Hesitation-driven drop-off responds better to an incentive than a plain reminder.',
    dunning_sequence: 'Recurring billing needs a structured sequence, not a one-off message.',
    mandate_retry_sequence: 'A lapsed UPI mandate needs its own re-authorization flow, timed to NPCI\u2019s retry windows rather than a plain card retry.',
    reminder_email: 'Most overdue invoices at this stage are oversights, not refusals — a plain reminder is proportionate.',
    human_review: 'Signals are ambiguous or sensitive enough that automated contact isn\u2019t appropriate.',
    collections_escalation: 'Past the point where automated messaging is productive.',
    suppressed_opt_out: '',
    suppressed_quiet_hours: '',
  }
  return `${map[action]} (root cause: ${cause.replace(/_/g, ' ')})`
}
