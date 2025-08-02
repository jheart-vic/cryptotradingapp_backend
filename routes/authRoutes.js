import express from 'express'
import { register, login, verifyEmail, resendOtp, forgotPassword, resetPassword } from '../controllers/authController.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/verify-email', verifyEmail)
router.post('/resend-otp', resendOtp)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router
