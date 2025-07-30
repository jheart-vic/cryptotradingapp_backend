import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

import { sendVerificationEmail } from '../utils/mailer.js'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const register = async (req, res) => {
  try {
    const { username, phone, email, password, confirmPassword, invitedBy } = req.body

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: 'Passwords do not match' })
    }

    const existing = await User.findOne({ $or: [{ phone }, { email }] })
    if (existing) {
      return res.status(400).json({ msg: 'User already exists' })
    }

    // ✅ If invitedBy is provided, check that the inviter exists
    let inviter = null
    if (invitedBy) {
      inviter = await User.findOne({ inviteCode: invitedBy })
      if (!inviter) {
        return res.status(400).json({ msg: 'Invalid referral code' })
      }
    }

    const hashed = await bcrypt.hash(password, 10)
    const verificationCode = crypto.randomInt(100000, 999999).toString()

    const user = new User({
      username,
      phone,
      email,
      password: hashed,
      invitedBy: invitedBy || null,
      inviteCode: generateInviteCode(),
      isVerified: false,
      verificationCode,
      verificationCodeExpires: Date.now() + 10 * 60 * 1000, // 10 mins
    })

    await user.save()
    await sendVerificationEmail(email, verificationCode)

    res.json({ msg: 'Registered successfully. Please check your email for verification code.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: 'Registration failed. ' + err.message })
  }
}


export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ msg: 'User not found' })

    if (user.isVerified) return res.status(400).json({ msg: 'Email already verified' })

    if (
      user.verificationCode !== code ||
      user.verificationCodeExpires < Date.now()
    ) {
      return res.status(400).json({ msg: 'Invalid or expired code' })
    }

    user.isVerified = true
    user.verificationCode = undefined
    user.verificationCodeExpires = undefined
    await user.save()

    res.json({ msg: 'Email verified successfully' })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}


export const login = async (req, res) => {
  try {
    const { phone, password } = req.body
    const user = await User.findOne({ phone })
    if (!user) return res.status(400).json({ msg: 'User not found' })
    if (!user.isVerified) return res.status(401).json({ msg: 'Please verify your email to login' })


    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ msg: 'Incorrect password' })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}
