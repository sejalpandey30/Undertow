# Undertow

**An AI agent that catches revenue before it slips away — figures out why a payment or invoice failed, decides what to do about it, and runs a bounded, compliant recovery workflow with a full audit trail.**

---

## What it does

Revenue leaks in a handful of predictable ways: a card payment fails, a checkout gets abandoned halfway through, a subscription renewal bounces, or a B2B invoice just sits there overdue. Undertow runs every one of those events through the same pipeline — detect → diagnose → decide → execute — with a compliance layer that can veto any step, and an audit trail that logs everything the agent did and why.

Run a live batch of 42 synthetic cases and you can actually watch it work: root-cause diagnosis streams into a live ledger in real time, stopping rules get checked before a single message goes out, and the dashboard tracks revenue recovered, escalated, and suppressed — not just "processed."

*(Add a screenshot of the running dashboard here before publishing — run `npm run dev`, click "Run a live batch," and drop the image in.)*

## Why I built it this way

Most agent demos boil down to a chat window and a system prompt. I wanted this one to actually hold up like the real thing would need to: a decision engine where compliance checks run before the "smart" logic, not after; a deterministic simulation so a run is reproducible instead of just plausible-looking; and a clear line between what's simulated and what's a real integration point, so swapping in a real payment webhook later doesn't mean rewriting the reasoning.

## Features

- Four leak types, one pipeline — payment failures, checkout abandonment, subscription dunning, and overdue B2B receivables all flow through the same engine.
- Explainable diagnosis — every case gets a labeled root cause with a confidence score and a plain-language reason, not just a status badge.
- Compliance-first decisioning — do-not-contact, quiet hours, a 3-touch cap, and mandatory human escalation for fraud or disputes are checked before the "best action" logic runs, and they always win.
- Live audit ledger — every detect/diagnose/decide/execute/stop/resolve event streams in real time and is fully inspectable per case.
- India-specific recovery paths — a dedicated UPI Autopay mandate re-authorization sequence, plus Hinglish messaging that escalates from text to a logged IVR voice-call transcript if the customer doesn't respond.
- Deterministic simulation — a seeded PRNG means a given run is fully reproducible, which matters if you're calling something an audit trail.
- Zero-backend deployable — static build, no API keys, no database. Clone it and it runs in under a minute.

## Quick start

```
git clone https://github.com/<your-username>/undertow.git
cd undertow
npm install
npm run dev
```

Open the local URL it prints and click "Run a live batch of 42 cases."

```
npm run build     # production build -> dist/
npm run preview   # serve that build locally
```

## Architecture

```
src/
├── engine/
│   ├── types.ts        Domain model: RevenueCase, RootCause, ActionType, AuditEntry
│   ├── diagnose.ts      Signal -> root cause, with confidence + reasoning
│   ├── decide.ts        Root cause -> action, gated by stopping rules
│   ├── execute.ts       Simulated outcome, weighted by risk score + action fit
│   ├── messages.ts      Channel + copy per action (incl. Hinglish/voice variants)
│   ├── runBatch.ts      Orchestrates the full pipeline, builds the audit trail
│   └── rng.ts           Seeded PRNG for reproducible runs
├── data/
│   └── generator.ts     Synthetic case generator (all 4 leak types)
├── store/
│   └── useBatchStore.ts Zustand store; streams the audit log into the UI
└── components/          Dashboard, ledger, case table/drawer, compliance panel
```

Pipeline for a single case: a leak event is detected, diagnosed into a root cause with a confidence score, run through stopping rules (opt-out, quiet hours, touch cap, escalation) before any action is chosen, and then executed — with an audit entry logged at every single stage.

## Engineering decisions

A few choices worth explaining, since they're the parts I'd actually want to talk through in a review:

- Stopping rules run before the decision logic, not after. `decide()` checks do-not-contact, quiet hours, and the touch cap first, and returns early if any of them fire — the "best action" cause-to-action table never even runs in that case. That's how I'd want compliance to actually work: a gate, not a filter you bolt on afterward.
- Diagnosis and message copy are kept decoupled from case type where it matters. Checkout payment-field friction and a stale subscription card look similar at a glance but need very different messages. They're modeled as distinct root causes so the copy stays correct. This was a real bug I caught while testing — an earlier version was routing checkout-abandonment cases into subscription-renewal language, which would've been a genuinely bad customer experience if it were live.
- The simulation is seeded, not random. A batch run is fully reproducible from its seed, which is necessary if you're calling the output an audit trail. It also makes the whole engine testable headless — every function in the engine folder is pure, no DOM dependency.
- Voice isn't just a label. Repeated touches to Hinglish-speaking customers escalate from WhatsApp/SMS to a logged IVR call transcript, because that's a materially different (and more realistic for the Indian market) recovery pattern than just switching the language in a text message.
- The line between "simulated" and "real" is deliberate, not blurry. `execute()` is the only function that fakes an outcome. Everything upstream of it — detection shape, diagnosis rules, decision gating — is written the way it would be in production, so plugging in a real payment webhook later shouldn't require touching the reasoning logic at all.

## From prototype to production

- Detection: synthetic data generator now → Stripe/Adyen webhooks, cart/analytics events, subscription billing events, ERP-fed AR aging in production
- Diagnosis: rule table now → same interface with richer signals (issuer response codes, historical retry success, NLP on invoice correspondence)
- Decision: rule table + stopping rules now → same interface, but stopping-rule logic should live server-side and stay authoritative regardless of who calls it
- Execution: simulated outcome now → real send via Twilio/SendGrid + real retry via the payment processor, with actual delivery/payment status replacing the simulated dice roll
- Audit trail: in-memory array now → append-only store (Postgres table or event log)

## Tech stack

Vite, React 18, TypeScript (strict), Tailwind CSS, Zustand, Recharts, Lucide.

No backend, no database, no API keys — the whole app is a static bundle. That was a deliberate constraint so anyone can clone and run it in under a minute instead of hunting for env vars.

## Deployment

Static build, deployable anywhere: Vercel (vercel.json included), Netlify (netlify.toml included), or any static host like S3+CloudFront, GitHub Pages, or Cloudflare Pages after `npm run build`.

## Roadmap

- Swap `execute()` for real Twilio/SendGrid sends behind a feature flag
- Persist the audit trail to Postgres instead of an in-memory array
- Add a Playwright test suite covering the full pipeline end-to-end
- Replace the ambiguous-case diagnosis rules with an LLM-assisted classifier

## License

MIT.

---

Built as a prototype exploring agentic workflows for financial recovery. All customer data, invoices, and messages in this demo are synthetic — nothing is actually sent and no payments are actually processed.

