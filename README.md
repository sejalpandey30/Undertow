# Undertow — AI Revenue Recovery

An agent that detects revenue at risk, diagnoses why it's leaking, decides the
right intervention, and executes a bounded, compliant recovery workflow —
with a full audit trail and measured outcomes across a batch.

Covers all six example directions from the brief:
- **Payment failure** → root cause → recovery action (soft decline, expired card, insufficient funds, processor glitch, suspected fraud)
- **Checkout abandonment** recovery (OTP drop, shipping-cost shock, payment-field friction, price hesitation)
- **Failed-subscription (dunning)** recovery
- **B2B receivables chasing**, including a promise-to-pay tracker
- **Mandate retry sequencer** — lapsed UPI Autopay mandates get their own re-authorization flow instead of a plain card retry
- **Hinglish voice recovery** — repeated touches to Hinglish-speaking customers escalate from text to a logged IVR call transcript, still with an explicit opt-out

This is a self-contained, click-to-run **prototype**: everything (data,
messaging, outcomes) is simulated client-side so it's honest about what's
real and what's a stand-in, and so it's trivial to run and deploy with zero
backend or API keys.

## Run it

```bash
npm install
npm run dev       # local dev server
npm run build     # production build -> dist/
npm run preview   # serve the production build locally
```

## Deploy it

The app is a static site (Vite build output in `dist/`) — no server or
environment variables required.

- **Vercel**: import the repo, framework preset "Vite" is auto-detected, or use the included `vercel.json`.
- **Netlify**: `netlify.toml` is included — drag-and-drop `dist/` or connect the repo.
- **Any static host** (S3+CloudFront, GitHub Pages, Cloudflare Pages): serve the contents of `dist/` after `npm run build`.

## How it works

Click **"Run a live batch of 42 cases"**. The agent runs a deterministic
(seeded) simulation through four stages for every case, and streams the
result into the audit ledger in real time:

1. **Detect** — a synthetic batch of leak events is generated (`src/data/generator.ts`).
2. **Diagnose** — rules map observed signals (decline code, drop-off stage,
   overdue days, failed-cycle count) to a labeled root cause with a
   confidence score (`src/engine/diagnose.ts`).
3. **Decide** — the root cause maps to an intervention, but **stopping
   rules are checked first and always win**: do-not-contact customers are
   never messaged, nothing goes out during quiet hours, no case is
   contacted more than 3 times, and ambiguous/sensitive cases (suspected
   fraud, disputed invoices) are routed to a human instead of being
   auto-messaged (`src/engine/decide.ts`).
4. **Execute** — the chosen message is composed (including Hinglish
   variants for `hi-en` locale customers, per the brief's "Hinglish voice
   recovery" direction) and an outcome is simulated, weighted by the
   case's risk score and how well-matched the action is
   (`src/engine/execute.ts`, `src/engine/messages.ts`).

Every step of every case is written to an immutable audit log
(`src/engine/runBatch.ts`) that the UI both streams live (the ledger) and
lets you inspect per-case (click any row in the case table).

## From prototype to production

The architecture is deliberately split so the simulated parts are easy to
swap for real integrations without touching the diagnosis/decision logic:

| Layer | Prototype (this repo) | Production swap-in |
|---|---|---|
| Case detection | `generateBatch()` synthetic data | Webhooks from Stripe/Adyen/your PSP, cart/analytics events, subscription billing events, AR aging from your ledger |
| Diagnosis | Rule table in `diagnose.ts` | Same shape, backed by richer signals (issuer response codes, historical retry success by BIN, NLP on invoice correspondence) |
| Decision | Rule table + stopping rules in `decide.ts` | Same interface — the stopping-rule logic (rate limits, quiet hours, opt-out, escalation triggers) should stay server-side and authoritative regardless of what calls it |
| Execution | `execute()` simulates an outcome | Real send via email/SMS/WhatsApp provider + real retry via your PSP, with the actual response (delivered, paid, bounced) replacing the simulated roll |
| Audit trail | In-memory array | Append-only store (e.g. Postgres table or event log) — the schema in `types.ts` (`AuditEntry`) is already shaped for this |

## Project structure

```
src/
  engine/       diagnosis, decision, execution, orchestration, types
  data/         synthetic case generator
  store/        zustand store driving the live-run UI
  components/   dashboard UI
```

## Stack

Vite + React + TypeScript + Tailwind CSS + Zustand + Recharts. No backend,
no API keys, no database — intentionally, so anyone can clone and run this
in under a minute.
