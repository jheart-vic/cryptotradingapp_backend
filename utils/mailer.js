import nodemailer from 'nodemailer'

export const sendVerificationEmail = async (email, code) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or use your SMTP provider
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
      tls: {
        rejectUnauthorized: false, // ✅ allow self-signed certs (local/dev only)
      },
  })

  const mailOptions = {
    from: `"KubraX" <${process.env.EMAIL_USERNAME}>`,
    to: email,
    subject: 'Verify Your Email',
    html: `<h1>Your verification code is: <b>${code}</b></h1>`
  }

  await transporter.sendMail(mailOptions)
}
