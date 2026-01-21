import nodemailer from 'nodemailer'

function getTransporter() {
  const emailPort = parseInt(process.env.EMAIL_PORT || '587')
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: emailPort,
    secure: emailPort === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
}

export async function sendOTPEmail(
  email: string,
  otp: string,
  isExistingUser: boolean
): Promise<void> {
  const transporter = getTransporter()

  const subject = isExistingUser
    ? 'Your login code for Uptime Monitor'
    : 'Verify your email for Uptime Monitor'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Uptime Monitor</h2>
      <p>${isExistingUser ? 'Your login code is:' : 'Your verification code is:'}</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">
          ${otp}
        </span>
      </div>
      <p style="color: #6b7280;">This code expires in 10 minutes.</p>
      <p style="color: #6b7280;">If you didn't request this code, you can safely ignore this email.</p>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">
        Uptime Monitor - Keep your services running
      </p>
    </div>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@uptimemonitor.com',
    to: email,
    subject,
    html,
  })
}

export async function sendInvitationEmail(
  email: string,
  organizationName: string,
  inviterName: string,
  inviteUrl: string
): Promise<void> {
  const transporter = getTransporter()

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">You've been invited!</h2>
      <p>${inviterName} has invited you to join <strong>${organizationName}</strong> on Uptime Monitor.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #6b7280;">This invitation expires in 7 days.</p>
      <p style="color: #6b7280; font-size: 12px;">
        If you can't click the button, copy and paste this link into your browser:<br/>
        <a href="${inviteUrl}" style="color: #3b82f6;">${inviteUrl}</a>
      </p>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@uptimemonitor.com',
    to: email,
    subject: `Join ${organizationName} on Uptime Monitor`,
    html,
  })
}
