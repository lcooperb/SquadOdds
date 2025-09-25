export type EmailOptions = {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    // Fallback: log to console in development if SMTP not configured
    console.warn('[email] SMTP not fully configured. Logging email instead.')
    console.info(`[email] To: ${to}`)
    console.info(`[email] Subject: ${subject}`)
    console.info(`[email] HTML: ${html}`)
    return { ok: true, logged: true }
  }

  // Dynamically import nodemailer to keep it out of edge bundles
  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.default.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for others
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  })

  return { ok: true }
}
