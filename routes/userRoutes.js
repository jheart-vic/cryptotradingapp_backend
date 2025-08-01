import express from 'express';
import { auth } from '../middleware/auth.js';
import { getUserProfile, getReferralInfo, getUserTrades } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', auth, getUserProfile);
router.get('/referral-link', auth, getReferralInfo);
router.get('/my-trades', auth, getUserTrades);

export default router;