import express from 'express';
import {
  getUserHistory,
  getUnreadCount,
  markAllAsRead,
  markOneAsRead,
} from '../controllers/historyController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getUserHistory);
router.get('/unread-count', auth, getUnreadCount);
router.put('/mark-all', auth, markAllAsRead);
router.put('/mark/:id', auth, markOneAsRead);

export default router;
