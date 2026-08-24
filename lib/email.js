// Transactional email. Best-effort and non-throwing — a mail failure must never
// break a webhook or business operation. sendAdminEmail targets ADMIN_EMAILS;
// sendMail + the user-facing builders send from the shared Gmail mailbox
// (lib/mail-config.js) to a single recipient.
import "server-only";

import { logger } from "@/lib/logger";
import GetMailConfig from "@/lib/mail-config";

const ADMIN_RECIPIENTS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

export async function sendAdminEmail({ subject, html, text }) {
  try {
    if (ADMIN_RECIPIENTS.length === 0) {
      logger.warn("sendAdminEmail skipped — ADMIN_EMAILS is empty", {
        subject,
      });
      return;
    }
    const { from, transport } = GetMailConfig("admin");
    await transport.sendMail({
      from,
      to: ADMIN_RECIPIENTS.join(", "),
      subject,
      html,
      text,
    });
  } catch (error) {
    logger.error("Admin email failed to send", {
      subject,
      message: error?.message,
    });
  }
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

function firstName(name) {
  const first = String(name ?? "")
    .trim()
    .split(/\s+/)[0];
  return first || "there";
}

/** Generic best-effort send from the shared mailbox to one recipient. */
export async function sendMail({ profile = "admin", to, subject, html, text }) {
  try {
    if (!to) return;
    const { from, transport } = GetMailConfig(profile);
    await transport.sendMail({ from, to, subject, html, text });
  } catch (error) {
    logger.error("Email failed to send", {
      profile,
      subject,
      message: error?.message,
    });
  }
}

// Branded HTML frame for a user-facing email.
function shell({ title, lead, cta }) {
  const button = cta?.href
    ? `<a href="${cta.href}" style="display:inline-block;margin-top:18px;background:#2563eb;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;font-size:14px;">${esc(cta.label)}</a>`
    : "";
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#0b1220;color:#ffffff;padding:18px 22px;border-radius:10px 10px 0 0;">
      <div style="font-size:18px;font-weight:700;">FitOrLose</div>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 10px 10px;padding:24px 22px;background:#ffffff;color:#111827;">
      <h1 style="margin:0 0 10px;font-size:20px;line-height:1.3;">${esc(title)}</h1>
      <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${lead}</p>
      ${button}
    </div>
    <div style="color:#9ca3af;font-size:11px;text-align:center;margin-top:12px;">You're receiving this because you have a FitOrLose account.</div>
  </div>`;
}

/** New-user welcome (akshat profile). */
export async function sendWelcomeEmail({ to, name }) {
  await sendMail({
    profile: "akshat",
    to,
    subject: "Welcome to FitOrLose",
    html: shell({
      title: `Welcome, ${esc(firstName(name))}!`,
      lead: "You just joined a community that puts real money behind real goals. Pick a goal, put a stake on it, and let's make it happen — no excuses.",
      cta: { href: `${APP_URL}/create`, label: "Create your first challenge" },
    }),
    text: `Welcome to FitOrLose, ${firstName(name)}! Create your first challenge: ${APP_URL}/create`,
  });
}

/** Challenge went live after payment (akshat profile, motivational). */
export async function sendChallengeCreatedEmail({ to, name, challenge }) {
  const amount = money(challenge?.amount, challenge?.currency);
  const link = challenge?.id
    ? `${APP_URL}/challenges/${challenge.id}`
    : `${APP_URL}/dashboard`;
  await sendMail({
    profile: "akshat",
    to,
    subject: `You're locked in — ${amount} on the line`,
    html: shell({
      title: `It's on, ${esc(firstName(name))}.`,
      lead: `Your challenge <strong>${esc(challenge?.title)}</strong> is live and <strong>${amount}</strong> is on the line. Show up, do the work, and win it back — we're rooting for you.`,
      cta: { href: link, label: "View your challenge" },
    }),
    text: `Your challenge "${challenge?.title}" is live — ${amount} on the line. ${link}`,
  });
}

/** Proof received (admin profile, acknowledge). */
export async function sendProofSubmittedEmail({ to, name, challenge }) {
  const link = challenge?.id
    ? `${APP_URL}/challenges/${challenge.id}`
    : `${APP_URL}/dashboard`;
  await sendMail({
    profile: "admin",
    to,
    subject: "We got your proof",
    html: shell({
      title: "Proof received",
      lead: `Thanks, ${esc(firstName(name))} — your proof for <strong>${esc(challenge?.title)}</strong> is in and now under review. We'll let you know once it's been checked.`,
      cta: { href: link, label: "View your challenge" },
    }),
    text: `We received your proof for "${challenge?.title}". It's under review. ${link}`,
  });
}

/** Submission reviewed (admin profile, info). `decision` is "approve"|"reject". */
export async function sendSubmissionReviewedEmail({
  to,
  name,
  challenge,
  decision,
}) {
  const approved = decision === "approve";
  const link = challenge?.id
    ? `${APP_URL}/challenges/${challenge.id}`
    : `${APP_URL}/dashboard`;
  await sendMail({
    profile: "admin",
    to,
    subject: approved
      ? "Your proof was verified"
      : "Your proof needs another look",
    html: shell({
      title: approved ? "Proof verified" : "Back under review",
      lead: approved
        ? `Good news, ${esc(firstName(name))} — your proof for <strong>${esc(challenge?.title)}</strong> has been verified. Keep going!`
        : `Your proof for <strong>${esc(challenge?.title)}</strong> wasn't accepted this time, so it's back under review. You can submit clearer proof from your challenge page.`,
      cta: { href: link, label: "View your challenge" },
    }),
    text: approved
      ? `Your proof for "${challenge?.title}" was verified. ${link}`
      : `Your proof for "${challenge?.title}" needs another look — submit more from ${link}`,
  });
}

/** Reward processed (akshat profile, congratulating). */
export async function sendRewardEmail({
  to,
  name,
  challenge,
  amount,
  currency,
}) {
  const amt = money(amount, currency);
  await sendMail({
    profile: "akshat",
    to,
    subject: `You did it — ${amt} is on its way back`,
    html: shell({
      title: `Congratulations, ${esc(firstName(name))}!`,
      lead: `You completed <strong>${esc(challenge?.title)}</strong> and your reward of <strong>${amt}</strong> has been processed. That's what backing yourself looks like. Ready for the next one?`,
      cta: { href: `${APP_URL}/create`, label: "Start another challenge" },
    }),
    text: `Congratulations! You won "${challenge?.title}" and your reward of ${amt} has been processed. ${APP_URL}/create`,
  });
}

/** Dispute acknowledged (support profile). */
export async function sendDisputeOpenedEmail({ to, name, challenge }) {
  const link = challenge?.id
    ? `${APP_URL}/challenges/${challenge.id}`
    : `${APP_URL}/dashboard`;
  await sendMail({
    profile: "support",
    to,
    subject: "We've received your dispute",
    html: shell({
      title: "Dispute received",
      lead: `Thanks, ${esc(firstName(name))} — we've received your dispute for <strong>${esc(challenge?.title)}</strong>. Our team will re-review your challenge and get back to you.`,
      cta: { href: link, label: "View your challenge" },
    }),
    text: `We received your dispute for "${challenge?.title}". Our team will re-review and get back to you. ${link}`,
  });
}

const KIND_META = {
  succeeded: { label: "SUCCEEDED", color: "#059669", emoji: "✅" },
  failed: { label: "FAILED", color: "#dc2626", emoji: "⚠️" },
  cancelled: { label: "CANCELLED", color: "#d97706", emoji: "🚫" },
};

function money(amount, currency) {
  const sym = currency === "USD" ? "$" : currency === "INR" ? "₹" : "";
  const n = Number(amount);
  const value = Number.isFinite(n) ? n.toLocaleString("en-IN") : amount;
  return `${sym}${value} ${currency ?? ""}`.trim();
}

function esc(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function row(label, value) {
  return `<tr>
    <td style="padding:8px 12px;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:8px 12px;color:#111827;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}

/**
 * Build + send a detailed admin alert for a payment webhook event.
 * `kind` is 'succeeded' | 'failed' | 'cancelled'. `event` is the raw Dodo event;
 * `challenge` (optional) is our DB row for the human-readable title.
 */
export async function sendPaymentAdminEmail({ kind, event, challenge }) {
  const meta = KIND_META[kind] ?? KIND_META.failed;
  const data = event?.data ?? {};
  const md = data.metadata ?? {};
  const customer = data.customer ?? {};
  const billing = data.billing ?? {};

  const currency = data.currency ?? challenge?.currency ?? null;
  const amount =
    data.total_amount != null
      ? Number(data.total_amount) / 100
      : (challenge?.amount ?? null);
  const amountLabel = amount != null ? money(amount, currency) : "—";

  const challengeTitle = challenge?.title ?? "—";
  const challengeId = md.challengeId ?? challenge?.id ?? null;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const challengeLink = challengeId
    ? `${appUrl}/challenges/${challengeId}`
    : null;

  const card =
    data.card_last_four && data.card_network
      ? `${data.card_network} ····${data.card_last_four}`
      : null;

  const subject = `[FitOrLose] ${meta.emoji} Payment ${meta.label} — ${amountLabel} · ${challengeTitle}`;

  const errorBlock =
    kind === "failed"
      ? `<div style="margin:0 0 16px;padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
           <div style="color:#991b1b;font-size:13px;font-weight:600;margin-bottom:4px;">Failure reason</div>
           <div style="color:#7f1d1d;font-size:14px;"><strong>${esc(data.error_code)}</strong> — ${esc(data.error_message)}</div>
         </div>`
      : "";

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:${meta.color};color:#ffffff;padding:16px 20px;border-radius:10px 10px 0 0;">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Payment ${meta.label}</div>
      <div style="font-size:24px;font-weight:700;margin-top:2px;">${amountLabel}</div>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 10px 10px;padding:20px;background:#ffffff;">
      ${errorBlock}
      <table style="width:100%;border-collapse:collapse;">
        ${row("Event", esc(event?.type))}
        ${row("Status", esc(data.status))}
        ${row("Amount", esc(amountLabel))}
        ${row("Challenge", `${esc(challengeTitle)}${challengeLink ? `<br/><a href="${challengeLink}" style="color:#2563eb;font-size:12px;">${challengeLink}</a>` : ""}`)}
        ${row("Challenge ID", esc(challengeId))}
        ${row("User", `${esc(customer.name)}${customer.email ? `<br/>${esc(customer.email)}` : ""}`)}
        ${row("Phone", esc(customer.phone_number))}
        ${row("Method", `${esc(data.payment_method)}${card ? ` · ${esc(card)}` : ""}`)}
        ${row("Our payment id", esc(md.paymentId))}
        ${row("Dodo payment id", esc(data.payment_id))}
        ${row("Billing", esc([billing.street, billing.city, billing.state, billing.zipcode, billing.country].filter(Boolean).join(", ")))}
        ${row("Time", esc(event?.timestamp ?? new Date().toISOString()))}
      </table>
    </div>
    <div style="color:#9ca3af;font-size:11px;text-align:center;margin-top:12px;">
      Financial truth lives in PostgreSQL — this is an operational alert.
    </div>
  </div>`;

  const text = [
    `FitOrLose — Payment ${meta.label}`,
    kind === "failed"
      ? `Reason: ${data.error_code ?? "—"} — ${data.error_message ?? "—"}`
      : null,
    `Amount: ${amountLabel}`,
    `Status: ${data.status ?? "—"}`,
    `Challenge: ${challengeTitle} (${challengeId ?? "—"})`,
    challengeLink ? `Link: ${challengeLink}` : null,
    `User: ${customer.name ?? "—"} <${customer.email ?? "—"}>`,
    `Phone: ${customer.phone_number ?? "—"}`,
    `Method: ${data.payment_method ?? "—"}${card ? ` · ${card}` : ""}`,
    `Our payment id: ${md.paymentId ?? "—"}`,
    `Dodo payment id: ${data.payment_id ?? "—"}`,
    `Time: ${event?.timestamp ?? new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendAdminEmail({ subject, html, text });
}
