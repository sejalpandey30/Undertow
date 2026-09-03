import type { RevenueCase, RootCause } from './types'

export interface Diagnosis {
  cause: RootCause
  confidence: number
  reasoning: string
}

export function diagnose(c: RevenueCase): Diagnosis {
  switch (c.type) {
    case 'payment_failure': {
      const code = String(c.meta.declineCode)
      const attempts = Number(c.meta.retryAttempts ?? 0)
      if (code === 'do_not_honor_fraud') {
        return {
          cause: 'suspected_fraud',
          confidence: 0.72,
          reasoning: 'Decline code pattern matches issuer fraud-hold behavior, not a balance or card issue.',
        }
      }
      if (code === 'expired_card') {
        return {
          cause: 'expired_card',
          confidence: 0.94,
          reasoning: 'Card expiry date on file has passed — retrying the same card will not help.',
        }
      }
      if (code === 'insufficient_funds') {
        return {
          cause: 'insufficient_funds',
          confidence: attempts > 0 ? 0.6 : 0.8,
          reasoning: attempts > 0
            ? 'Repeated insufficient-funds declines suggest a persistent balance issue, not timing.'
            : 'First decline reads as a timing issue — balance likely refreshes within days.',
        }
      }
      if (code === 'processor_glitch') {
        return {
          cause: 'processor_glitch',
          confidence: 0.83,
          reasoning: 'Decline signature matches a transient processor error rather than a card problem.',
        }
      }
      return {
        cause: 'issuer_soft_decline',
        confidence: 0.65,
        reasoning: 'Soft decline with no clear structural cause — issuer risk models flag intermittently.',
      }
    }
    case 'checkout_abandonment': {
      const stage = String(c.meta.stage)
      if (stage === 'otp_step') {
        return {
          cause: 'otp_drop',
          confidence: 0.79,
          reasoning: 'Drop-off concentrated at OTP entry — most likely delivery delay or user distraction, not intent loss.',
        }
      }
      if (stage === 'shipping_step') {
        return {
          cause: 'shipping_cost_shock',
          confidence: 0.68,
          reasoning: 'Abandonment right after shipping cost is shown is the classic sticker-shock pattern.',
        }
      }
      if (stage === 'payment_step') {
        return {
          cause: 'payment_field_friction',
          confidence: 0.55,
          reasoning: 'Stall at the payment field without a decline suggests friction entering card details, not a billing issue.',
        }
      }
      return {
        cause: 'price_hesitation',
        confidence: 0.5,
        reasoning: 'Late-stage drop with no technical error points to a final-review reconsideration.',
      }
    }
    case 'subscription_dunning': {
      const cycles = Number(c.meta.failedCycles ?? 1)
      if (c.meta.paymentMethod === 'upi_mandate') {
        return {
          cause: 'mandate_lapsed',
          confidence: 0.81,
          reasoning: 'Recurring UPI Autopay mandate failed at the bank leg — a plain card-style retry won\u2019t fire the mandate again; it needs its own re-authorization sequence.',
        }
      }
      return {
        cause: cycles >= 2 ? 'card_on_file_stale' : 'issuer_soft_decline',
        confidence: cycles >= 2 ? 0.77 : 0.6,
        reasoning: cycles >= 2
          ? 'Multiple failed renewal cycles on the same instrument point to a card that needs updating.'
          : 'Single failed renewal — likely a one-off issuer hiccup, worth a clean retry.',
      }
    }
    case 'overdue_receivable': {
      const days = Number(c.meta.daysOverdue ?? 0)
      if (days > 60) {
        return {
          cause: 'invoice_disputed',
          confidence: 0.58,
          reasoning: 'Silence past 60 days is more consistent with an unresolved dispute than an oversight.',
        }
      }
      if (days > 21) {
        return {
          cause: 'cashflow_delay',
          confidence: 0.62,
          reasoning: 'Mid-range overdue window matches typical B2B payment-cycle delay, not refusal to pay.',
        }
      }
      return {
        cause: 'invoice_forgotten',
        confidence: 0.7,
        reasoning: 'Short overdue window with no prior contact — most likely the invoice was simply missed.',
      }
    }
  }
}
