import type { ActionType, RevenueCase } from './types'

function fmtAmount(c: RevenueCase) {
  const symbol = c.currency === 'INR' ? '₹' : '$'
  return `${symbol}${c.amount.toFixed(2)}`
}

// Every message includes plain opt-out language — this is not optional
// copy, it is a compliance requirement the workflow enforces.
export function composeMessage(c: RevenueCase, action: ActionType): { channel: string; body: string } {
  const name = c.customer.name.split(' ')[0]
  const amount = fmtAmount(c)
  const hinglish = c.customer.locale === 'hi-en'
  const isFollowUpTouch = c.touches >= 2

  switch (action) {
    case 'smart_retry':
      return {
        channel: 'system',
        body: `Scheduled a smart retry for ${name}'s ${amount} charge, timed to typical balance-refresh windows. No message sent to customer.`,
      }
    case 'card_update_link':
      return hinglish
        ? {
            channel: 'WhatsApp',
            body: `Hi ${name}, aapka card expire ho gaya hai isliye ${amount} ka payment process nahi ho paaya. Yahan se 30 second mein naya card add kar sakte hain: [update-card link]. Reply STOP to opt out.`,
          }
        : {
            channel: 'email',
            body: `Hi ${name}, your card on file has expired, which is why the ${amount} charge didn't go through. Update it in under a minute: [update-card link]. Reply STOP to opt out anytime.`,
          }
    case 'checkout_nudge':
      return hinglish
        ? {
            channel: 'WhatsApp',
            body: `${name}, aapka cart (${amount}) safe rakha hai. OTP nahi aaya kya? Yahan se turant complete karein: [checkout link]. Reply STOP to opt out.`,
          }
        : {
            channel: 'email',
            body: `${name}, we've held your cart (${amount}) for you. Pick up right where you left off: [checkout link]. Reply STOP to opt out.`,
          }
    case 'discount_nudge':
      return {
        channel: 'email',
        body: `${name}, still thinking it over? Here's 10% off your ${amount} order if you complete it in the next 48 hours: [checkout link]. Reply STOP to opt out.`,
      }
    case 'dunning_sequence':
      if (hinglish && isFollowUpTouch) {
        return {
          channel: 'voice (IVR callback)',
          body: voiceTranscript(
            `Namaste ${name}, main aapki subscription team se bol raha hoon. Aapka ${amount} ka renewal payment fail ho gaya tha. Kya aap abhi apna payment method update karna chahenge? Agar haan, toh main aapko ek secure link SMS kar deta hoon. Agar aap yeh calls nahi chahte, toh bataiye, hum turant list se hata denge.`
          ),
        }
      }
      return hinglish
        ? {
            channel: 'SMS',
            body: `${name}, aapki subscription renewal (${amount}) fail ho gayi thi. Payment method update karke seamlessly continue karein: [billing link]. Reply STOP to opt out.`,
          }
        : {
            channel: 'email',
            body: `${name}, your subscription renewal (${amount}) didn't go through. Update your payment method to keep things running without interruption: [billing link]. Reply STOP to opt out.`,
          }
    case 'mandate_retry_sequence':
      if (isFollowUpTouch) {
        return {
          channel: 'voice (IVR callback)',
          body: voiceTranscript(
            `Namaste ${name}, yeh ek automated call hai aapke UPI Autopay mandate ke baare mein. Aapka ${amount} ka mandate is baar process nahi ho paaya — bank ki taraf se authorization expire ho gaya lagta hai. Main abhi ek re-authorization link bhej sakta hoon jisse aap apne UPI app mein 1 tap se confirm kar sakein. Agar aap dobara call na chahte hon, toh 'STOP' boliye, hum is number ko turant hata denge.`
          ),
        }
      }
      return {
        channel: 'WhatsApp',
        body: `${name}, aapka UPI Autopay mandate (${amount}) is cycle process nahi hua — bank-side authorization laps ho gaya hai. Naya mandate 1 tap mein re-confirm karein: [reauthorize-mandate link]. NPCI ke retry window ke hisaab se yeh link 72 hours tak valid hai. Reply STOP to opt out.`,
      }
    case 'reminder_email':
      return {
        channel: 'email',
        body: `Hi ${name}, a friendly nudge that invoice ${c.meta.invoiceNumber} (${amount}) is now due. Happy to answer any questions — reply here or pay directly: [invoice link].`,
      }
    case 'promise_to_pay':
      return {
        channel: 'email',
        body: `Thanks for confirming, ${name} — we've logged a promise to pay ${amount} on ${c.promiseDate}. We'll follow up only if that date passes.`,
      }
    case 'collections_escalation':
      return {
        channel: 'email + human handoff',
        body: `Hi ${name}, invoice ${c.meta.invoiceNumber} (${amount}) is now ${c.meta.daysOverdue} days overdue. This has been routed to our accounts team for a direct conversation.`,
      }
    case 'human_review':
      return {
        channel: 'internal',
        body: `Flagged for human review before any customer contact — risk signals don't clear the bar for automated outreach.`,
      }
    case 'suppressed_opt_out':
      return {
        channel: 'internal',
        body: `No outreach sent — customer is marked do-not-contact. Case left for manual or non-messaging recovery only.`,
      }
    case 'suppressed_quiet_hours':
      return {
        channel: 'internal',
        body: `Outreach deferred — would have landed inside the customer's quiet hours window.`,
      }
  }
}

// A voice-channel touch is logged as a transcript rather than a message
// body, since that's what an audit trail for an IVR/voice-bot call
// actually needs to preserve: what was said and that opt-out was offered.
function voiceTranscript(script: string): string {
  return `[Call transcript] ${script}`
}
