import nodemailer from "nodemailer";

const SENDER_NAME = "Contact FitorLose";

// Gmail SMTP. The FROM (CONTACT_EMAIL) may be a "Send mail as" alias on a custom
// domain, which can't be used as the SMTP login — so auth uses GMAIL_USER (the
// real Google account holding the App Password), falling back to CONTACT_EMAIL.
export default function GetMailConfig() {
  const from = process.env.CONTACT_EMAIL;
  const authUser = process.env.GMAIL_USER || from;
  return {
    name: SENDER_NAME,
    from: `${SENDER_NAME} <${from}>`,
    transport: nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: authUser, pass: process.env.CONTACT_PASSWORD },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    }),
  };
}
