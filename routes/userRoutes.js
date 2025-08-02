import express from 'express';
import { auth } from '../middleware/auth.js';
import { getUserProfile, getReferralInfo, getUserTrades, updateUserProfile } from '../controllers/userController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/me', auth, getUserProfile);
router.get('/referral-link', auth, getReferralInfo);
router.get('/my-trades', auth, getUserTrades);
router.put('/user/update-profile', auth, upload.single('image'), updateUserProfile);

export default router;