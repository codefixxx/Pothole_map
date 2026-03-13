import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_APP_PASSWORD, // app password
  },
})

type SendEmailParams = {
  to: string
  subject: string
  meta: {
    description: string
    link: string
  }
}

export async function sendEmail({ to, subject, meta }: SendEmailParams) {
  const html = `
  <div style="background:#f4f6f8;padding:40px 0;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
      
      <h1 style="
        margin:0 0 16px 0;
        font-size:24px;
        font-weight:600;
        color:#111827;
        text-align:center;
      ">
        ${subject}
      </h1>

      <p style="
        font-size:15px;
        color:#4b5563;
        line-height:1.6;
        margin-bottom:24px;
        text-align:center;
      ">
        ${meta.description}
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${meta.link}" target="_blank"
          style="
            display:inline-block;
            padding:12px 22px;
            background:#2563eb;
            color:#ffffff;
            text-decoration:none;
            border-radius:8px;
            font-size:14px;
            font-weight:500;
          ">
          Continue
        </a>
      </div>

      <p style="
        font-size:12px;
        color:#9ca3af;
        text-align:center;
        margin-top:32px;
      ">
        If the button doesn’t work, copy and paste this link:<br/>
        <span style="word-break:break-all;">${meta.link}</span>
      </p>

    </div>
  </div>
  `

  try {
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_USER,
      to,
      subject,
      html,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Email send error:", error)
    return { success: false, error }
  }
}

