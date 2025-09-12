import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { DateTime } from 'luxon'
import crypto from 'crypto'
import { sendVerificationEmail } from '../utils/mailer.js'
import { customAlphabet } from 'nanoid';

const OTP_EXPIRY_MINUTES = 10;
const COOLDOWN_SECONDS = 60;


const generateInviteCode = async () => {
  const nanoid = customAlphabet('1234567890', 6); // 6-digit numeric code
  let code;
  let exists = true;

  while (exists) {
    code = nanoid();
    exists = await User.findOne({ inviteCode: code });
  }

  return code;
};

export const register = async (req, res) => {
  try {
    const { username, phone, email, password, confirmPassword, invitedBy } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: 'Passwords do not match' });
    }

    // Check if phone or email already exists
    const existing = await User.findOne({ $or: [{ phone }, { email }] });
    if (existing) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    let inviter = null;

    if (invitedBy) {
      // Find inviter by invite code
      inviter = await User.findOne({ inviteCode: invitedBy });
      if (!inviter) {
        return res.status(400).json({ msg: 'Invalid referral code' });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = DateTime.now().plus({ minutes: OTP_EXPIRY_MINUTES });

    const newInviteCode = await generateInviteCode();

    // Create the user
    const user = new User({
      username,
      phone,
      email,
      password: hashed,
      invitedBy: inviter ? inviter._id : null,
      inviteCode: newInviteCode,
      isVerified: false,
      verificationCode,
      verificationCodeExpires: expiresAt.toJSDate(),
    });

    // Try to send the verification email
    try {
      await sendVerificationEmail(email, verificationCode);
    } catch (emailErr) {
      console.error('❌ Email sending failed:', emailErr);
      return res.status(500).json({ msg: 'Failed to send verification email. Please try again.' });
    }

    await user.save();

    // Update inviter's invitedUsers array
    if (inviter) {
      inviter.invitedUsers.push(user._id);
      await inviter.save();
    }

    res.json({ msg: 'Registered successfully. Please check your email for verification code.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Registration failed. ' + err.message });
  }
};

export const resendOtp = async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })

  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const now = DateTime.now()
  const lastSentTime = DateTime.fromJSDate(user.verificationCodeExpires).minus({ minutes: OTP_EXPIRY_MINUTES })

  if (now.diff(lastSentTime, 'seconds').seconds < COOLDOWN_SECONDS) {
    return res.status(429).json({ error: 'Please wait before requesting another OTP.' })
  }

  const otp = generateInviteCode()
  const expires = now.plus({ minutes: OTP_EXPIRY_MINUTES })

  user.verificationCode = otp
  user.verificationCodeExpires = expires.toJSDate()
  await user.save()

  try {
    const data = await sendVerificationEmail(email, otp)
    res.json({ message: 'OTP resent successfully', data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to resend OTP' })
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ msg: 'User not found' })

    if (user.isVerified) return res.status(400).json({ msg: 'Email already verified' })

    const now = DateTime.now()
    const expiry = DateTime.fromJSDate(user.verificationCodeExpires)

    if (user.verificationCode !== code || expiry < now) {
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
    const { phone, password } = req.body;

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    // If user exists but is not verified
    if (!user.isVerified) {
      return res.status(401).json({
        msg: 'Please verify your email to login',
        email: user.email
      });
    }

    // Now check password ONLY if verified
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Return token and safe user data
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isVerified: user.isVerified,
        username: user.username
      }
    });

  } catch (err) {
    console.error(err, "error message");
    res.status(500).json({ msg: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = DateTime.now().plus({ minutes: 10 }).toJSDate()

    user.resetCode = resetCode
    user.resetCodeExpires = expires
    await user.save()

    // Send code via email
    await sendVerificationEmail(email, resetCode)

    res.json({ message: 'Reset code sent to email' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword, confirmPassword } = req.body

    if (!email || !resetCode || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' })
    }

    const user = await User.findOne({ email, resetCode })
    if (!user) {
      return res.status(400).json({ error: 'Invalid reset code or email' })
    }

    const isExpired = DateTime.now() > DateTime.fromJSDate(user.resetCodeExpires)
    if (isExpired) {
      return res.status(400).json({ error: 'Reset code has expired' })
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10)
    user.password = hashed
    user.resetCode = undefined
    user.resetCodeExpires = undefined
    await user.save()

    res.json({ message: 'Password has been reset successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}