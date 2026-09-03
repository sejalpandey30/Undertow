import type { LeakType, RevenueCase } from '../engine/types'
import { intRange, makeRng, pick, range, weightedPick } from '../engine/rng'

const FIRST_NAMES = [
  'Ananya', 'Rohan', 'Priya', 'Vikram', 'Meera', 'Karan', 'Sofia', 'Liam',
  'Noah', 'Emma', 'Aditya', 'Ishaan', 'Diya', 'Arjun', 'Olivia', 'Wei',
  'Fatima', 'Lucas', 'Sara', 'Devendra',
]
const LAST_NAMES = [
  'Sharma', 'Mehta', 'Patel', 'Rao', 'Kapoor', 'Nair', 'Chen', 'Garcia',
  'Johnson', 'Iyer', 'Verma', 'Singh', 'Fernandes', 'Kim', 'Ahmed',
]
const COMPANIES = [
  'Northwind Traders', 'Bluepeak Studio', 'Fernshaw Logistics', 'Corta Labs',
  'Haldi & Co', 'Meridian Textiles', 'Vantage Robotics', 'Ridgeline Foods',
  'Sundial Media', 'Anchorpoint Freight',
]

function personName(rng: () => number) {
  return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`
}

let counter = 0
function nextId(prefix: string) {
  counter += 1
  return `${prefix}-${String(counter).padStart(4, '0')}`
}

function genPaymentFailure(rng: () => number, now: number): RevenueCase {
  const declineCode = weightedPick(rng, [
    ['insufficient_funds', 32],
    ['expired_card', 22],
    ['issuer_soft_decline', 24],
    ['processor_glitch', 12],
    ['do_not_honor_fraud', 10],
  ] as [string, number][])
  const amount = Math.round(range(rng, 8, 240) * 100) / 100
  const locale = rng() < 0.35 ? 'hi-en' : 'en'
  return {
    id: nextId('PF'),
    type: 'payment_failure',
    customer: { name: personName(rng), locale, doNotContact: rng() < 0.06 },
    amount,
    currency: locale === 'hi-en' ? 'INR' : 'USD',
    createdAt: now - intRange(rng, 0, 72) * 3600_000,
    meta: { declineCode, retryAttempts: intRange(rng, 0, 2) },
    riskScore: range(rng, 0.2, 0.9),
    status: 'queued',
    actionsTaken: [],
    touches: 0,
  }
}

function genCheckoutAbandonment(rng: () => number, now: number): RevenueCase {
  const stage = weightedPick(rng, [
    ['payment_step', 40],
    ['otp_step', 25],
    ['shipping_step', 20],
    ['review_step', 15],
  ] as [string, number][])
  const amount = Math.round(range(rng, 15, 420) * 100) / 100
  const locale = rng() < 0.3 ? 'hi-en' : 'en'
  return {
    id: nextId('CO'),
    type: 'checkout_abandonment',
    customer: { name: personName(rng), locale, doNotContact: rng() < 0.05 },
    amount,
    currency: locale === 'hi-en' ? 'INR' : 'USD',
    createdAt: now - intRange(rng, 0, 48) * 3600_000,
    meta: { stage, cartItems: intRange(rng, 1, 6) },
    riskScore: range(rng, 0.25, 0.85),
    status: 'queued',
    actionsTaken: [],
    touches: 0,
  }
}

function genSubscriptionDunning(rng: () => number, now: number): RevenueCase {
  const plan = pick(rng, ['Starter', 'Growth', 'Scale', 'Team'])
  const amount = Math.round(range(rng, 12, 199) * 100) / 100
  const locale = rng() < 0.25 ? 'hi-en' : 'en'
  const paymentMethod = locale === 'hi-en' && rng() < 0.55 ? 'upi_mandate' : 'card'
  return {
    id: nextId('SD'),
    type: 'subscription_dunning',
    customer: { name: personName(rng), locale, doNotContact: rng() < 0.04 },
    amount,
    currency: locale === 'hi-en' ? 'INR' : 'USD',
    createdAt: now - intRange(rng, 0, 96) * 3600_000,
    meta: { plan, failedCycles: intRange(rng, 1, 3), paymentMethod },
    riskScore: range(rng, 0.3, 0.88),
    status: 'queued',
    actionsTaken: [],
    touches: 0,
  }
}

function genOverdueReceivable(rng: () => number, now: number): RevenueCase {
  const daysOverdue = intRange(rng, 3, 95)
  const amount = Math.round(range(rng, 400, 18000) * 100) / 100
  return {
    id: nextId('AR'),
    type: 'overdue_receivable',
    customer: {
      name: personName(rng),
      company: pick(rng, COMPANIES),
      locale: 'en',
      doNotContact: rng() < 0.03,
    },
    amount,
    currency: 'USD',
    createdAt: now - daysOverdue * 24 * 3600_000,
    meta: { daysOverdue, invoiceNumber: `INV-${intRange(rng, 10000, 99999)}` },
    riskScore: Math.max(0.15, 0.75 - daysOverdue / 140),
    status: 'queued',
    actionsTaken: [],
    touches: 0,
  }
}

const GENERATORS: Record<LeakType, (rng: () => number, now: number) => RevenueCase> = {
  payment_failure: genPaymentFailure,
  checkout_abandonment: genCheckoutAbandonment,
  subscription_dunning: genSubscriptionDunning,
  overdue_receivable: genOverdueReceivable,
}

export function generateBatch(seed: number, size = 42): RevenueCase[] {
  const rng = makeRng(seed)
  const now = Date.now()
  const weights: [LeakType, number][] = [
    ['payment_failure', 34],
    ['checkout_abandonment', 30],
    ['subscription_dunning', 22],
    ['overdue_receivable', 14],
  ]
  const cases: RevenueCase[] = []
  for (let i = 0; i < size; i++) {
    const type = weightedPick(rng, weights)
    cases.push(GENERATORS[type](rng, now))
  }
  return cases.sort((a, b) => a.createdAt - b.createdAt)
}
