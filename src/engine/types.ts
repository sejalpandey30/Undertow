export type LeakType =
  | 'payment_failure'
  | 'checkout_abandonment'
  | 'subscription_dunning'
  | 'overdue_receivable'

export type RootCause =
  | 'insufficient_funds'
  | 'expired_card'
  | 'issuer_soft_decline'
  | 'processor_glitch'
  | 'suspected_fraud'
  | 'otp_drop'
  | 'price_hesitation'
  | 'shipping_cost_shock'
  | 'payment_field_friction'
  | 'card_on_file_stale'
  | 'invoice_disputed'
  | 'invoice_forgotten'
  | 'cashflow_delay'
  | 'mandate_lapsed'

export type ActionType =
  | 'smart_retry'
  | 'card_update_link'
  | 'checkout_nudge'
  | 'discount_nudge'
  | 'dunning_sequence'
  | 'reminder_email'
  | 'promise_to_pay'
  | 'collections_escalation'
  | 'human_review'
  | 'suppressed_opt_out'
  | 'suppressed_quiet_hours'
  | 'mandate_retry_sequence'

export type CaseStatus =
  | 'queued'
  | 'diagnosing'
  | 'in_progress'
  | 'recovered'
  | 'promised'
  | 'escalated'
  | 'suppressed'
  | 'lost'

export interface Customer {
  name: string
  company?: string
  locale: 'en' | 'hi-en'
  doNotContact: boolean
}

export interface RevenueCase {
  id: string
  type: LeakType
  customer: Customer
  amount: number
  currency: 'USD' | 'INR'
  createdAt: number
  meta: Record<string, string | number>
  riskScore: number // 0-1, likelihood recovery succeeds unaided by better routing
  status: CaseStatus
  rootCause?: RootCause
  rootCauseConfidence?: number
  actionsTaken: ActionType[]
  touches: number
  recoveredAmount?: number
  promiseDate?: string
  resolvedAt?: number
}

export interface AuditEntry {
  id: string
  ts: number
  caseId: string
  caseRef: string
  stage: 'detect' | 'diagnose' | 'decide' | 'execute' | 'stop' | 'resolve'
  message: string
  detail?: string
}

export interface BatchMetrics {
  totalCases: number
  revenueAtRisk: number
  revenueRecovered: number
  promisedRevenue: number
  recoveryRate: number
  escalations: number
  suppressed: number
  avgTouches: number
  byType: Record<LeakType, { count: number; recovered: number; atRisk: number }>
  byAction: Partial<Record<ActionType, number>>
}
