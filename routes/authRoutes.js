import express from 'express'
import { register, login, verifyEmail, resendOtp } from '../controllers/authController.js'

const router = express.Router()

router.post('/register', register)
router.post('/verify-email', verifyEmail)
router.post('/resend-otp', resendOtp) // Assuming resend OTP uses the same register logic
router.post('/login', login)

export default router
