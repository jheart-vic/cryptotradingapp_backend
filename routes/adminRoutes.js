import express from 'express'
import {
  addUserBonus,
  getSignalHistory,
  createSignal,
  giveSpin,
  getSwitches,
  toggleSwitch,
  getAllWithdrawals,
  getAllDeposits,
  getAllTrades,
  impersonateUser,
  toggleUserHold,
  deleteUser,
  getAllUsers,
  getAdminDashboardStats,
  registerAdmin,
  loginAdmin,
  getRecentActivities,
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement
} from '../controllers/adminController.js'
import { auth, isAdmin } from '../middleware/auth.js'

const router = express.Router()

// Admin Auth
router.post('/admin-register', registerAdmin)
router.post('/admin-login', loginAdmin)

// 📊 Admin dashboard stats
router.get('/dashboard-stats',auth, isAdmin, getAdminDashboardStats)

// 👥 Users
router.get('/users',auth, isAdmin, getAllUsers)
router.delete('/users/:id',auth, isAdmin, deleteUser)
router.put('/users/:id/toggle-hold',auth, isAdmin, toggleUserHold)
router.post('/users/:userId/impersonate',auth, isAdmin, impersonateUser)
router.post('/users/:userId/bonus',auth, isAdmin, addUserBonus)
// 💹 Trades
router.get('/trades',auth, isAdmin, getAllTrades)

// 💸 Deposits
router.get('/deposits',auth, isAdmin, getAllDeposits)

// 🏦 Withdrawals
router.get('/withdrawals',auth, isAdmin, getAllWithdrawals)

// 📶 Signals
router.post('/signals',auth, isAdmin, createSignal)
router.get('/signals/history',auth, isAdmin, getSignalHistory)

// ⚙️ Feature switches
router.get('/switches',auth, isAdmin, getSwitches)
router.put('/switches/:key/toggle',auth, isAdmin, toggleSwitch)

// 🎡 Spin Wheel
router.post('/give-spin',auth, isAdmin, giveSpin)
router.get('/recent-activities', auth, isAdmin, getRecentActivities);

router.get('/admin/announcements', auth, isAdmin, getAllAnnouncements);
router.post('/admin/announcements', auth, isAdmin, createAnnouncement);
router.delete('/admin/announcements/:id', auth, isAdmin, deleteAnnouncement);

export default router
