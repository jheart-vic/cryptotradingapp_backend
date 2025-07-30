import nodemailer from 'nodemailer'

export const sendVerificationEmail = async (email, code) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or use your SMTP provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const mailOptions = {
    from: `"Your App Name" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email',
    html: `<h3>Your verification code is: <b>${code}</b></h3>`,
  }

  await transporter.sendMail(mailOptions)
}
